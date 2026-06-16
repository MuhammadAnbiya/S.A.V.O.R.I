import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/better-auth';
import { extractReceiptData } from '@/lib/gemini';

/**
 * POST /api/scanner/extract
 * Extracts receipt data from an image using Gemini Flash 2.5
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate session
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        {
          status: 'error',
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized access',
          },
        },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const { image_base64, mime_type, branch_id } = await request.json();

    // Validate required fields
    if (!image_base64 || !mime_type) {
      return NextResponse.json(
        {
          status: 'error',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: image_base64 and mime_type',
          },
        },
        { status: 400 }
      );
    }

    // 3. Extract data using Gemini
    const extractionResult = await extractReceiptData(image_base64, mime_type);

    // 4. Calculate average confidence from all fields
    let totalConfidence = 0;
    let count = 0;

    // Helper to accumulate confidence from a field object
    const addConfidence = (field: { confidence: number } | undefined) => {
      if (field && typeof field.confidence === 'number') {
        totalConfidence += field.confidence;
        count++;
      }
    };

    // Add confidence for top-level fields
    addConfidence(extractionResult.vendor_name);
    addConfidence(extractionResult.transaction_date);
    addConfidence(extractionResult.total_amount);

    // Add confidence for each item and its subfields
    extractionResult.items?.forEach((item: any) => {
      addConfidence(item.name);
      addConfidence(item.quantity);
      addConfidence(item.unit);
      addConfidence(item.unit_price);
      addConfidence(item.subtotal);
    });

    const averageConfidence = count > 0 ? totalConfidence / count : 0;

    // 5. Return standard API response format
    return NextResponse.json({
      status: 'success',
      data: {
        ...extractionResult,
        // We can also include the branch_id if provided, but the extraction result doesn't include it
        // According to the CLAUDE.md, the branch_id is optional input, not part of extraction
        // We'll just return the extraction result as is, and the caller can add branch_id if needed
      },
      metadata: {
        timestamp: new Date().toISOString(),
        average_confidence: Number(averageConfidence.toFixed(4)), // Keep 4 decimal places
        // Note: The CLAUDE.md says to return metadata.average_confidence
        // We'll also include other metadata if needed, but the spec only mentions average_confidence
      },
    });
  } catch (error: any) {
    console.error('Error in scanner/extract route:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process receipt',
          details: {
            // In development, we might want to include the error message, but in production we should hide it
            // However, following the CLAUDE.md, we can include details for debugging
            // But the standard format says details is optional and for field-level errors
            // We'll leave it empty for now, or we can put a generic message
          },
        },
      },
      { status: 500 }
    );
  }
}