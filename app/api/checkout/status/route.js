export async function GET(){return Response.json({configured:Boolean(process.env.STRIPE_SECRET_KEY)});}
