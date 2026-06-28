const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: tasks, error } = await supabase.from('tasks').select('*').eq('completed', false).limit(3);
  if (error) {
    console.error("Error fetching tasks:", error);
    return;
  }
  
  if (!tasks || tasks.length === 0) {
    console.log("No active tasks found to complete.");
    return;
  }

  const daysToSubtract = [1, 2, 4]; // Completed 1 day ago, 2 days ago, 4 days ago
  
  for (let i = 0; i < tasks.length; i++) {
    const d = new Date();
    d.setDate(d.getDate() - daysToSubtract[i]);
    
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ completed: true, completedAt: d.toISOString() })
      .eq('id', tasks[i].id);
      
    if (updateError) {
      console.error(`Failed to update task ${tasks[i].id}:`, updateError);
    } else {
      console.log(`Successfully completed task: ${tasks[i].title} at ${d.toISOString()}`);
    }
  }
}

run();
