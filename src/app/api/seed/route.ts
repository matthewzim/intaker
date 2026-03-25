import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

/**
 * POST /api/seed — seed demo data for the application.
 * Only available in development. Idempotent: clears and re-seeds each time.
 */
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Seeding not allowed in production' }, { status: 403 })
  }

  const db = createServerClient()

  try {
    // Clear existing demo data
    await db.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await db.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await db.from('cases').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // ── Case 1: Strong employment discrimination case (accepted) ──────────────
    const { data: case1 } = await db.from('cases').insert({
      client_name: 'Sarah Chen',
      client_email: 'sarah.chen@example.com',
      status: 'accepted',
      legal_category: 'Employment Law',
      legal_subcategory: 'Workplace Discrimination',
      viability_score: 'strong',
      viability_reasoning: 'Clear pattern of discriminatory conduct with documented evidence, multiple witnesses, and recent timeline within statute of limitations.',
      summary: `## Case Overview
Sarah Chen was terminated from her position as Senior Engineer at TechCorp after 6 years following her pregnancy announcement. The termination occurred 3 weeks after disclosure despite positive performance reviews.

## Key Facts
- Employed at TechCorp Inc. as Senior Software Engineer for 6 years
- Terminated 3 weeks after announcing pregnancy (January 15, 2024)
- Performance reviews were "Exceeds Expectations" just 2 months prior
- Two colleagues have agreed to serve as witnesses
- HR records show pattern of terminating female employees before maternity leave

## Legal Issues
- Pregnancy Discrimination Act (PDA) violation
- Title VII gender discrimination
- Potential FMLA interference

## Risks & Weaknesses
- Company may claim restructuring as pretext
- Need to obtain complete HR records via discovery

## Missing Information
- Employment contract and termination letter
- Email correspondence around termination date
- HR complaint history at TechCorp`,
      extracted_facts: {
        parties: ['Sarah Chen (plaintiff)', 'TechCorp Inc. (defendant)', 'HR Director James Miller'],
        timeline: ['July 2018: Sarah hired as Senior Engineer', 'November 2023: Exceeds Expectations review', 'January 8, 2024: Announced pregnancy', 'January 29, 2024: Terminated'],
        key_events: ['Pregnancy announced to manager', 'Termination 3 weeks later', 'Two witnesses corroborate hostile reaction from management'],
        damages: ['Lost salary: ~$145,000/year', 'Lost benefits including health insurance', 'Emotional distress'],
        jurisdiction: 'California'
      },
      intake_complete: true,
      message_count: 12
    }).select().single()

    if (case1) {
      await db.from('messages').insert([
        { case_id: case1.id, role: 'client', content: 'I was fired from my job and I think it was because I told them I was pregnant.', message_type: 'chat' },
        { case_id: case1.id, role: 'ai', content: "I'm so sorry to hear that. That sounds incredibly stressful. Can you tell me more about when you told your employer and what happened afterward?", message_type: 'chat' },
        { case_id: case1.id, role: 'client', content: 'I told my manager on January 8th. Three weeks later they called me into HR and said I was being let go due to performance issues. But I just got an excellent review in November!', message_type: 'chat' },
        { case_id: case1.id, role: 'ai', content: "That timeline is very important — the proximity between your announcement and termination is significant. Do you have documentation of that performance review? And did your manager say anything about the pregnancy at the time of termination?", message_type: 'chat' },
        { case_id: case1.id, role: 'client', content: 'Yes I have the review saved. My manager didn\'t mention the pregnancy directly but a colleague overheard him saying he "couldn\'t deal with the situation" after I told him.', message_type: 'chat' },
        { case_id: case1.id, role: 'lawyer', content: "Thank you for sharing your case, Sarah. I've reviewed the intake summary and this looks like a strong potential claim. I'd like to schedule a call to discuss next steps. Are you available this week?", message_type: 'chat' },
        { case_id: case1.id, role: 'client', content: "Yes absolutely! I'm available Tuesday or Thursday afternoon.", message_type: 'chat' },
      ])
    }

    // ── Case 2: Medium contract dispute (reviewing) ────────────────────────────
    const { data: case2 } = await db.from('cases').insert({
      client_name: 'Marcus Thompson',
      client_email: 'marcus.t@example.com',
      status: 'reviewing',
      legal_category: 'Contract Dispute',
      legal_subcategory: 'Breach of Contract',
      viability_score: 'medium',
      viability_reasoning: 'Clear breach of contract terms but damages are modest and contract language has some ambiguity. Outcome depends heavily on contract interpretation.',
      summary: `## Case Overview
Marcus Thompson hired a contractor to renovate his kitchen for $28,000. The contractor abandoned the project after receiving 70% payment ($19,600), leaving work incomplete and the kitchen unusable.

## Key Facts
- Signed contract for full kitchen renovation: $28,000
- Paid $19,600 (70%) per payment schedule
- Contractor stopped work after 6 weeks, citing "supply chain issues"
- Kitchen has been unusable for 3 months
- Contractor is not responding to communications

## Legal Issues
- Breach of contract (abandonment)
- Unjust enrichment
- Potential contractor license violation

## Risks & Weaknesses
- Contractor may claim impossibility of performance
- Need to determine contractor's financial ability to repay
- May need to complete work elsewhere and seek difference in damages

## Missing Information
- Signed contract with payment schedule
- All payment receipts/records
- Photos of incomplete work
- Any written communications with contractor`,
      extracted_facts: {
        parties: ['Marcus Thompson (plaintiff)', 'ProBuild Contractors LLC (defendant)', 'Mike Rodriguez (contractor)'],
        timeline: ['September 2023: Contract signed for $28,000', 'October 2023: Work began', 'November 2023: 70% paid ($19,600)', 'December 2023: Contractor abandoned project', 'March 2024: Kitchen still unusable'],
        key_events: ['Contract executed', 'Multiple payments made', 'Contractor abandoned after receiving majority of payment', 'Repeated unanswered communications'],
        damages: ['$19,600 already paid for incomplete work', 'Estimated $15,000 additional to complete with another contractor', '3 months without usable kitchen'],
        jurisdiction: 'Texas'
      },
      intake_complete: true,
      message_count: 9
    }).select().single()

    if (case2) {
      await db.from('messages').insert([
        { case_id: case2.id, role: 'client', content: 'I hired a contractor to renovate my kitchen and he took my money and disappeared.', message_type: 'chat' },
        { case_id: case2.id, role: 'ai', content: "That's a very frustrating situation. Can you tell me more about how much you paid and whether you had a written contract?", message_type: 'chat' },
        { case_id: case2.id, role: 'client', content: 'Yes, we had a written contract for $28,000 total. I paid him $19,600 which was the 70% milestone. He worked for about 6 weeks then just stopped showing up.', message_type: 'chat' },
        { case_id: case2.id, role: 'ai', content: "When did the contractor last communicate with you, and did he give any reason for stopping?", message_type: 'chat' },
        { case_id: case2.id, role: 'client', content: 'He sent me a text in December saying there were supply chain delays. After that, nothing. It\'s been 3 months and my kitchen is completely unusable.', message_type: 'chat' },
        { case_id: case2.id, role: 'lawyer', content: "Hi Marcus, I've had a chance to review your case details. This does appear to be a breach of contract situation. I have a few questions about the contract terms before we proceed.", message_type: 'chat' },
      ])
    }

    // ── Case 3: New personal injury (just submitted) ───────────────────────────
    const { data: case3 } = await db.from('cases').insert({
      client_name: 'Jennifer Walsh',
      client_email: 'jwalsh@example.com',
      status: 'new',
      legal_category: 'Personal Injury',
      legal_subcategory: 'Slip and Fall',
      viability_score: 'medium',
      viability_reasoning: 'Documented injury with medical records and incident report, but liability will depend on establishing the property owner knew about the hazard.',
      summary: `## Case Overview
Jennifer Walsh suffered a fractured wrist in a slip-and-fall accident at a grocery store after slipping on an unmarked wet floor. She has medical documentation and an incident report was filed.

## Key Facts
- Slipped on wet floor at Sunshine Grocery (no wet floor sign)
- Fractured left wrist requiring surgery
- Incident report filed same day
- Security camera footage may exist

## Legal Issues
- Premises liability / negligence
- Store had duty to warn of wet floor hazard

## Risks & Weaknesses
- Store may argue contributory negligence (looking at phone, rushing)
- Need to establish how long the hazard existed

## Missing Information
- Surveillance footage (critical — must request immediately)
- Witness information
- Full medical records and bills`,
      extracted_facts: {
        parties: ['Jennifer Walsh (plaintiff)', 'Sunshine Grocery Inc. (defendant)'],
        timeline: ['February 10, 2024: Slip and fall accident', 'February 10, 2024: Incident report filed', 'February 12, 2024: Surgery for fractured wrist'],
        key_events: ['Slipped on wet floor with no warning sign', 'Emergency room visit', 'Wrist surgery required'],
        damages: ['Medical bills: ~$22,000 (surgery)', 'Lost wages: 6 weeks', 'Pain and suffering'],
        jurisdiction: 'Florida'
      },
      intake_complete: true,
      message_count: 7
    }).select().single()

    if (case3) {
      await db.from('messages').insert([
        { case_id: case3.id, role: 'client', content: 'I slipped and fell at a grocery store and broke my wrist. The floor was wet with no warning sign.', message_type: 'chat' },
        { case_id: case3.id, role: 'ai', content: "I'm sorry to hear about your injury. Can you tell me when this happened and have you received medical treatment?", message_type: 'chat' },
        { case_id: case3.id, role: 'client', content: 'It happened on February 10th at Sunshine Grocery on Main Street. I went to the ER that night and it turns out I fractured my wrist. I needed surgery two days later.', message_type: 'chat' },
        { case_id: case3.id, role: 'ai', content: "That's a serious injury. Did you file an incident report with the store at the time? And were there any witnesses to the fall?", message_type: 'chat' },
        { case_id: case3.id, role: 'client', content: 'Yes, a store manager came over and filed a report. There were other shoppers around but I didn\'t get their names. I\'ve been out of work for 4 weeks already and the bills are piling up.', message_type: 'chat' },
      ])
    }

    // ── Case 4: Weak case (rejected) ──────────────────────────────────────────
    const { data: case4 } = await db.from('cases').insert({
      client_name: 'Robert Kim',
      client_email: 'rkim@example.com',
      status: 'rejected',
      legal_category: 'Contract Dispute',
      legal_subcategory: 'Consumer Complaint',
      viability_score: 'weak',
      viability_reasoning: 'Damages are minimal (~$200), no clear legal violation, and the terms of service likely permit the platform\'s actions. Cost of litigation far exceeds potential recovery.',
      summary: `## Case Overview
Robert Kim disputes being charged a subscription fee after attempting to cancel an online service. The total disputed amount is approximately $200 across 4 months.

## Key Facts
- Attempted to cancel streaming subscription in September 2023
- Continued to be charged $49.99/month for 4 months
- Total disputed amount: ~$200
- Has emails showing cancellation attempt

## Legal Issues
- Potential unfair billing practice
- May violate automatic renewal laws (varies by state)

## Risks & Weaknesses
- Damages too small to justify litigation
- Terms of service may protect company
- Small claims court is the appropriate venue

## Missing Information
- Cancellation confirmation (or lack thereof)
- Terms of service at time of subscription`,
      extracted_facts: {
        parties: ['Robert Kim (plaintiff)', 'StreamMax Inc. (defendant)'],
        timeline: ['September 2023: Attempted cancellation', 'September–December 2023: Continued charges'],
        key_events: ['Cancellation attempt via website', 'Continued monthly charges', 'Customer service refused refund'],
        damages: ['$199.96 in disputed charges'],
        jurisdiction: 'New York'
      },
      intake_complete: true,
      message_count: 6
    }).select().single()

    if (case4) {
      await db.from('messages').insert([
        { case_id: case4.id, role: 'client', content: 'A streaming service kept charging me after I cancelled. I want to sue them.', message_type: 'chat' },
        { case_id: case4.id, role: 'ai', content: "I understand how frustrating unauthorized charges can be. How much have you been charged and for how long?", message_type: 'chat' },
        { case_id: case4.id, role: 'client', content: 'About $50 a month for 4 months, so $200 total. I cancelled in September but they kept charging me.', message_type: 'chat' },
        { case_id: case4.id, role: 'ai', content: "Do you have documentation of your cancellation attempt, such as a confirmation email or screenshot?", message_type: 'chat' },
        { case_id: case4.id, role: 'client', content: 'I have the email I sent them but no confirmation. They just ignored it.', message_type: 'chat' },
        { case_id: case4.id, role: 'lawyer', content: "Thank you for sharing your situation, Robert. After reviewing your case, I'm not able to take this on at this time. The disputed amount of $200 is below our minimum threshold for representation. I'd recommend disputing the charges with your credit card company or filing in small claims court — both are free and straightforward for amounts this size.", message_type: 'chat' },
      ])
    }

    return NextResponse.json({
      data: {
        message: 'Demo data seeded successfully',
        cases: [
          { id: case1?.id, name: 'Sarah Chen — Employment (Strong)' },
          { id: case2?.id, name: 'Marcus Thompson — Contract (Medium)' },
          { id: case3?.id, name: 'Jennifer Walsh — Personal Injury (Medium)' },
          { id: case4?.id, name: 'Robert Kim — Consumer (Weak, Rejected)' },
        ],
      },
    })
  } catch (error) {
    console.error('[POST /api/seed]', error)
    return NextResponse.json({ error: 'Seeding failed', details: String(error) }, { status: 500 })
  }
}
