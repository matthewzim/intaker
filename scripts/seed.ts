/**
 * Seed script for Caseflow demo data.
 * Run with: npm run seed
 * (or call POST /api/seed during development)
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 */

// Load environment variables
import { config } from 'process'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const dotenv = require('dotenv')
dotenv.config({ path: '.env.local' })

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

async function seed() {
  console.log('🌱 Seeding Caseflow demo data...')
  console.log(`   Calling: ${BASE_URL}/api/seed`)

  try {
    const res = await fetch(`${BASE_URL}/api/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    const json = await res.json()

    if (!res.ok) {
      console.error('❌ Seed failed:', json.error)
      process.exit(1)
    }

    console.log('✅ Seed complete!')
    console.log('\nDemo cases created:')
    for (const c of json.data.cases) {
      console.log(`   • ${c.name}`)
      console.log(`     → ${BASE_URL}/lawyer/case/${c.id}`)
    }

    console.log('\nOpen the lawyer dashboard to review cases:')
    console.log(`   ${BASE_URL}/lawyer`)
    console.log('\nOr start a new client intake:')
    console.log(`   ${BASE_URL}/`)
  } catch (error) {
    console.error('❌ Error:', error)
    console.error('\nMake sure the dev server is running: npm run dev')
    process.exit(1)
  }
}

seed()
