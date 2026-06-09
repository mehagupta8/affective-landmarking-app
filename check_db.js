const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('https://qessmtekrzkmwfmxdiew.supabase.co', 'sb_publishable_KT0-ghcn7NyDnS26dV2K9w_2ETCdXF4')

async function check() {
  const { data, error } = await supabase.from('texts').select('*').limit(1)
  if (error) {
    console.error('Error:', error.message)
    return
  }
  if (data && data.length > 0) {
    console.log('Columns in texts:', Object.keys(data[0]))
  } else {
    console.log('No data in texts, but connected.')
  }
}
check()
