const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('https://qessmtekrzkmwfmxdiew.supabase.co', 'sb_publishable_KT0-ghcn7NyDnS26dV2K9w_2ETCdXF4')

async function check() {
  const { data, error } = await supabase.from('students').select('*').limit(1)
  if (error) {
    console.error('Error:', error.message)
    return
  }
  if (data && data.length > 0) {
    console.log('Columns in students:', Object.keys(data[0]))
  } else {
    // If no data, try to get column names by inserting and rolling back or just catch error on specific select
    const { error: colError } = await supabase.from('students').select('auth_user_id').limit(1)
    if (colError) {
      console.log('auth_user_id column NOT found:', colError.message)
    } else {
      console.log('auth_user_id column FOUND')
    }
  }
}
check()
