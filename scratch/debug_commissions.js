const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dqtopletjmylvvzjnved.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdG9wbGV0am15bHZ2empudmVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM2Mjk3MSwiZXhwIjoyMDk1OTM4OTcxfQ.JXrmCvnX9dyWefwm1xcFrUEtP2aJuR8VnBl7IAEvlpo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== AGENT APPLICATIONS ===");
  const { data: apps } = await supabase.from('agent_applications').select('*');
  console.log(apps);

  console.log("=== AGENT COMMISSIONS ===");
  const { data: comms } = await supabase.from('agent_commissions').select('*');
  console.log(comms);

  console.log("=== AGENCY CLIENT REQUESTS ===");
  const { data: reqs } = await supabase.from('agency_client_requests').select('*');
  console.log(reqs);
}

run();
