import { NextRequest, NextResponse } from 'next/server';
import { runProfessionalStrategyWorkflow } from '../../../../lib/langgraph-strategy';

export async function POST(req: NextRequest) {
  try {
    const { goal, goalName, businessType, userId, expectations, businessData, connectedPlatforms } = await req.json();

    if (!goal) {
      return NextResponse.json({ error: "Goal is required" }, { status: 400 });
    }

    // Convert connectedPlatforms object to array of names
    const platforms: string[] = [];
    if (connectedPlatforms) {
        if (connectedPlatforms.facebook) platforms.push("Facebook");
        if (connectedPlatforms.instagram) platforms.push("Instagram");
        if (connectedPlatforms.tiktok) platforms.push("TikTok");
        if (connectedPlatforms.linkedin) platforms.push("LinkedIn");
    }
    
    // Fallback if none provided
    if (platforms.length === 0) platforms.push("Instagram", "Facebook");

    console.log(`[STRATEGY] Starting Professional LangGraph strategy for user ${userId}`);
    
    const result = await runProfessionalStrategyWorkflow(
        businessType || "General",
        goalName || goal,
        expectations || "",
        platforms
    );

    console.log("[STRATEGY] LangGraph Strategy generated successfully.");
    return NextResponse.json({ 
        strategy: result.strategy,
        analysis: result.analysis 
    });
  } catch (error: any) {
    console.error("[STRATEGY] Error generating strategy with LangGraph:", error);
    return NextResponse.json({ error: error.message || "Failed to generate strategy" }, { status: 500 });
  }
}

