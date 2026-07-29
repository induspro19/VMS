import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import webpush from "npm:web-push@3.6.7";

// Configure web-push
const publicVapidKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const privateVapidKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const subject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@enterprise.com";

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(subject, publicVapidKey, privateVapidKey);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { hostEmployeeId, visitorName, visitorId, company, notificationType = 'VISITOR_WAITING', message } = await req.json();

    if (!hostEmployeeId) {
      return new Response(JSON.stringify({ error: "Missing hostEmployeeId" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Fetch all push subscriptions for this employee
    const { data: subscriptions, error } = await supabaseClient
      .from("push_subscriptions")
      .select("*")
      .eq("employee_id", hostEmployeeId);

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No push subscriptions found for this employee." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payloadData = {
      title: "🔔 New Visitor Waiting",
      body: `${visitorName} from ${company} is waiting to meet you.`,
      visitorId: visitorId,
      url: `/VMS/#/employee?tab=pending&visitor=${visitorId}`,
      type: 'VISITOR_WAITING'
    };

    // If it's a reminder or other type, we can infer from the body or add a type field to req.json()
    if (notificationType === 'REMINDER') {
      payloadData.title = "Visitor Reminder";
      payloadData.body = message || `${visitorName} is still waiting for you.`;
      payloadData.type = 'REMINDER';
    }

    const payload = JSON.stringify(payloadData);

    // Save to employee_notifications
    await supabaseClient.from("employee_notifications").insert({
      employee_id: hostEmployeeId,
      title: payloadData.title,
      message: payloadData.body,
      type: payloadData.type,
      visitor_id: visitorId,
    });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription_json, payload, { TTL: 86400, urgency: 'high' });
      } catch (err) {
        console.error("Push failed for subscription:", sub.id, err);
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired or invalid, remove it
          await supabaseClient.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    });

    await Promise.all(sendPromises);

    return new Response(
      JSON.stringify({ success: true, message: `Sent push to ${subscriptions.length} devices.` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
