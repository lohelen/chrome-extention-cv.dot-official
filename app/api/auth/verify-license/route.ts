export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

// Lemon Squeezy IDs — hardcoded for security validation
const STORE_ID = 321397
const PRODUCT_ID = 961908
const PRO_VARIANT_ID = 1510704
const PREMIUM_VARIANT_ID = 1525825

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, licenseKey } = body

    if (!licenseKey?.trim()) {
      return NextResponse.json(
        { error: 'Please provide a license key' },
        { status: 400 }
      )
    }

    // Step 1: Activate the license key with Lemon Squeezy
    const lsResponse = await fetch(
      'https://api.lemonsqueezy.com/v1/licenses/activate',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          license_key: licenseKey.trim(),
          instance_name: email || 'CV.dot Extension',
        }),
      }
    )

    const lsData = await lsResponse.json()

    // If activation fails, try validation instead (key may already be activated)
    if (!lsData.activated && lsData.error) {
      // Try validate instead — the key might already be activated
      const validateResponse = await fetch(
        'https://api.lemonsqueezy.com/v1/licenses/validate',
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            license_key: licenseKey.trim(),
          }),
        }
      )

      const validateData = await validateResponse.json()

      if (!validateData.valid) {
        return NextResponse.json(
          { error: validateData.error || 'Invalid or expired license key' },
          { status: 400 }
        )
      }

      // Use validate response data instead
      return await handleLicenseResponse(validateData, email)
    }

    return await handleLicenseResponse(lsData, email)
  } catch (error) {
    console.error('License verification error:', error)
    return NextResponse.json(
      { error: 'Verification service unavailable. Please try again later.' },
      { status: 500 }
    )
  }
}

async function handleLicenseResponse(data: any, email?: string) {
  const meta = data.meta
  const licenseKey = data.license_key

  // Security check 1: Verify store_id matches our store
  if (meta?.store_id !== STORE_ID) {
    return NextResponse.json(
      { error: 'This license key does not belong to CV.dot' },
      { status: 400 }
    )
  }

  // Security check 2: Verify product_id matches our product
  if (meta?.product_id !== PRODUCT_ID) {
    return NextResponse.json(
      { error: 'This license key is not valid for this product' },
      { status: 400 }
    )
  }

  // Security check 3: Verify email matches (if provided)
  if (email && meta?.customer_email) {
    if (meta.customer_email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This license key was purchased with a different email address' },
        { status: 400 }
      )
    }
  }

  // Security check 4: Verify license key is not expired or disabled
  if (licenseKey?.status === 'expired') {
    return NextResponse.json(
      { error: 'This license key has expired. Please renew your subscription.' },
      { status: 400 }
    )
  }

  if (licenseKey?.status === 'disabled') {
    return NextResponse.json(
      { error: 'This license key has been disabled.' },
      { status: 400 }
    )
  }

  // Determine tier based on variant_id
  let tier: 'free' | 'pro' | 'premium' = 'pro'

  if (meta?.variant_id === PREMIUM_VARIANT_ID) {
    tier = 'premium'
  } else if (meta?.variant_id === PRO_VARIANT_ID) {
    tier = 'pro'
  }

  // Update Supabase users tier to ensure Quota limits work
  if (email) {
    try {
      // Use .upsert with lowercased email to force the update/creation of the user record
      const cleanEmail = email.trim().toLowerCase();
      const { error, data } = await supabase
        .from('users')
        .upsert({ 
            email: cleanEmail, 
            tier: tier, 
            plan_status: 'active',
            updated_at: new Date().toISOString()
        }, { 
            onConflict: 'email',
            ignoreDuplicates: false 
        })
        .select();
      
      console.log("Supabase UPSERT tier attempt:", { email: cleanEmail, tier, error, data });
      if (error) console.error('Failed to upsert Supabase user tier:', error);
    } catch (err) {
      console.error('Supabase upsert exception:', err);
    }
  }

  return NextResponse.json({
    success: true,
    tier,
    customerEmail: meta?.customer_email,
    expiresAt: licenseKey?.expires_at || null,
  })
}
