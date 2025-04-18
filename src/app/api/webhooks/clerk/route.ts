import { clerkClient } from "@clerk/nextjs/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { createUser } from "@/lib/action/user.action";
import { log } from "console";
import next from "next";

export async function POST(request: Request) {
    const SIGNING_SECRET = process.env.SIGNING_SECRET

  if (!SIGNING_SECRET) {
    throw new Error('Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env')
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET)

  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing Svix headers', {
      status: 400,
    })
  }
  // Get body
  const payload = await request.json()
  const body = JSON.stringify(payload)

  let evt: WebhookEvent

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error: Could not verify webhook:', err)
    return new Response('Error: Verification error', {
      status: 400,
    })
  }

  // Do something with payload
  // For this guide, log payload to console
  const { id } = evt.data
  const eventType = evt.type
  
    // Check if user is created
    if (eventType === 'user.created') {
        const {id, email_addresses, first_name, last_name} = evt.data;

        // Create user in database

        const user = {
            clerkId: id,
            email: email_addresses[0],email_addresses,
            first_name: first_name,
            last_name: last_name,
        }

        console.log('Creating user in database:', user);


        const newUser = await createUser(user);

        if (newUser) {
            const client = await clerkClient();
            await client.users.updateUserMetadata(id, {
                publicMetadata: {
                    userId: newUser._id,
                },
            })
        }

        return NextResponse.json({message:"New User is created" , user : newUser});



  console.log(`Received webhook with ID ${id} and event type of ${eventType}`)
  console.log('Webhook payload:', body)

  return new Response('Webhook received', { status: 200 })

    }
    }