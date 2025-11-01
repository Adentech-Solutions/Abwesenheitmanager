import { NextResponse } from 'next/server';
import graphClient, { getUserDirectReports } from '@/lib/graph-client';

export async function GET() {
  try {
    // Test 1: Adele via E-Mail
    console.log('Testing Adele via email...');
    const adeleByEmail = await graphClient
      .api('/users/adelev@sxb87.onmicrosoft.com')
      .select('id,displayName,mail')
      .get();
    
    console.log('Adele ID:', adeleByEmail.id);
    
    // Test 2: Direct Reports von Adele
    console.log('Getting direct reports for Adele...');
    const reports = await getUserDirectReports(adeleByEmail.id);
    
    // Test 3: Salem's Manager
    console.log('Getting Salem...');
    const salem = await graphClient
      .api('/users/admin-sh@sxb87.onmicrosoft.com')
      .select('id,displayName,mail')
      .get();
    
    console.log('Salem ID:', salem.id);
    
    const salemManager = await graphClient
      .api(`/users/${salem.id}/manager`)
      .select('id,displayName,mail')
      .get();
    
    return NextResponse.json({
      success: true,
      adeleId: adeleByEmail.id,
      adeleDirectReports: reports,
      salemId: salem.id,
      salemManager: salemManager
    });
  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}