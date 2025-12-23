// src/app/api/debug-env/route.js

export async function GET(req) {
    const envVars = {
      googleId: process.env.GOOGLE_CLIENT_ID ? 'Loaded' : '!!! NOT FOUND !!!',
      googleSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Loaded' : '!!! NOT FOUND !!!',
      nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'Loaded' : '!!! NOT FOUND !!!',
      dbUrl: process.env.DATABASE_URL ? 'Loaded' : '!!! NOT FOUND !!!',
      nextAuthUrl: process.env.NEXTAUTH_URL ? process.env.NEXTAUTH_URL : '!!! NOT FOUND !!!',
    };
  
    return new Response(JSON.stringify(envVars, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  }