import { NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/mongodb";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const collection = db.collection("products");
    const body = await request.json();
    
    // Remove mongodb _id if present in body to avoid modification error
    const { _id, ...updateData } = body;
    
    const result = await collection.updateOne(
      { id: id },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, id, updated: updateData });
  } catch (error: any) {
    console.error("PUT product error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const collection = db.collection("products");
    
    const result = await collection.deleteOne({ id: id });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("DELETE product error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
