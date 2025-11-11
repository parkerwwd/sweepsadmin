import { NextRequest, NextResponse } from 'next/server'

// Type for giveaway data
interface GiveawayData {
  title?: string
  prize_name?: string
  prize_value?: string | number
  end_date?: string
  max_entries_per_day?: string | number
  [key: string]: string | number | undefined
}

// Templates based on sweeps sites
const templates = {
  description_1: [
    "What if one simple entry could change everything? The {title} is your chance to turn ordinary days into extraordinary possibilities. It costs nothing to enter, yet the reward could redefine how you live, celebrate, and dream. Take the leap today—your future self might thank you for it!",
    "Every journey begins with a single step, and yours starts here. The {title} offers you a chance to win {prize}, absolutely free. No purchase necessary, just pure possibility waiting to unfold. This could be the moment that changes everything.",
    "Dreams don't have expiration dates, and neither does opportunity. Enter the {title} today for your chance to win {prize}. It takes just seconds to enter, but the impact could last a lifetime. Why wait for tomorrow when today could be your day?",
    "Life is full of surprises, and the best ones come when you least expect them. The {title} gives you the chance to win {prize} with no strings attached. Free to enter, priceless to win. Your next chapter could start with a single click.",
    "Sometimes the smallest actions lead to the biggest rewards. Enter the {title} for your opportunity to win {prize}. It's completely free to participate, and the only thing you stand to lose is the chance if you don't try."
  ],
  description_2: {
    intro: [
      "Imagine the thrill of winning {prize}—money you didn't expect, but now opens the door to endless possibilities.",
      "Picture yourself as the winner of {prize}. What would you do first?",
      "Think about how amazing it would feel to win {prize} in the {title}.",
      "Winning {prize} could be the game-changer you've been waiting for.",
      "What if {prize} suddenly appeared in your bank account?"
    ],
    uses: [
      "You could finally book that weekend getaway you've been dreaming about, splurge on a new gadget, treat yourself to a shopping spree, or simply enjoy the peace of mind that comes with a little extra cushion in your bank account.",
      "Whether it's upgrading your lifestyle, investing in your future, tackling those bills, or treating yourself to something special, the choice would be entirely yours.",
      "From practical needs to pure indulgence, {prize} gives you the freedom to choose. Pay off debts, save for the future, or create unforgettable experiences.",
      "This could be your chance to breathe easier financially, pursue a passion project, help loved ones, or simply enjoy life's little luxuries.",
      "The possibilities are endless: home improvements, dream vacations, educational opportunities, or building your emergency fund."
    ],
    middle: [
      "Think about how good it would feel to pay down some bills, save for something special, or surprise a loved one with a gift \"just because.\" With {prize}, you can create memories, ease stress, and enjoy the freedom of having extra cash to spend however you choose.",
      "This isn't just about money—it's about opportunity. The chance to say yes to experiences you've been postponing, to invest in yourself, or to share your good fortune with others.",
      "Every winner has a story, and yours could be next. Whether you're planning for the future or living in the moment, {prize} gives you options you didn't have yesterday.",
      "Financial freedom, even temporary, opens doors. With {prize}, you could tackle that project, take that trip, or simply enjoy the security of having funds set aside."
    ],
    entry_details: [
      "You can enter up to {max_entries} times per day until {end_date} for your shot at this exciting prize. The best part? It's completely free to enter—your only investment is a few seconds of your time for the chance to walk away {prize} richer.",
      "Enter daily for maximum chances to win! With up to {max_entries} entries allowed per day through {end_date}, your odds improve with every submission. And remember, it's absolutely free to participate.",
      "Multiple daily entries mean multiple chances to win. Submit up to {max_entries} entries each day until {end_date}. No purchase necessary, no catch—just pure opportunity.",
      "Increase your chances by entering every day! You're allowed {max_entries} entries daily through {end_date}. It costs nothing but could mean everything."
    ],
    closing: [
      "Don't miss your chance to win—enter today, and keep entering daily until the giveaway closes. Your next {prize} adventure could be right around the corner!",
      "The clock is ticking, and every day you don't enter is a chance missed. Start today and make entering part of your daily routine. {prize} is waiting for its winner—why not you?",
      "Success favors the persistent. Enter today, tomorrow, and every day until {end_date}. Your dedication could pay off in a big way!",
      "This is your invitation to possibility. Accept it by entering today, and don't stop until the final day. {prize} has to go to someone—make sure you're in the running!"
    ]
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function formatPrize(prizeValue: number | string): string {
  if (typeof prizeValue === 'number' || !isNaN(Number(prizeValue))) {
    const value = Number(prizeValue)
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${value.toLocaleString()}`
    } else {
      return `$${value}`
    }
  }
  return prizeValue.toString()
}

function generateDescription1(data: GiveawayData): string {
  const template = templates.description_1[Math.floor(Math.random() * templates.description_1.length)]
  
  return template
    .replace(/{title}/g, data.title || 'sweepstakes')
    .replace(/{prize}/g, formatPrize(data.prize_value || 0))
}

function generateDescription2(data: GiveawayData): string {
  const intro = templates.description_2.intro[Math.floor(Math.random() * templates.description_2.intro.length)]
  const uses = templates.description_2.uses[Math.floor(Math.random() * templates.description_2.uses.length)]
  const middle = templates.description_2.middle[Math.floor(Math.random() * templates.description_2.middle.length)]
  const entryDetails = templates.description_2.entry_details[Math.floor(Math.random() * templates.description_2.entry_details.length)]
  const closing = templates.description_2.closing[Math.floor(Math.random() * templates.description_2.closing.length)]
  
  const maxEntries = data.max_entries_per_day || 1
  const endDate = formatDate(data.end_date || new Date().toISOString())
  const prize = formatPrize(data.prize_value || 0)
  
  let description = `${intro}\n\n${uses}\n\n${middle}\n\n${entryDetails}\n\n`
  
  // Add a "what would you do" paragraph
  description += `What would you do with your winnings? Plan a fun night out, put it toward a home project, add it to your savings, or finally treat yourself to something you've been putting off. The choice is yours, and that's what makes it so exciting.\n\n`
  
  description += closing
  
  // Replace all placeholders
  description = description
    .replace(/{title}/g, data.title || 'sweepstakes')
    .replace(/{prize}/g, prize)
    .replace(/{max_entries}/g, maxEntries.toString())
    .replace(/{end_date}/g, endDate)
  
  return description
}

export async function POST(request: NextRequest) {
  try {
    const { type, giveawayData } = await request.json()
    
    if (!type || !giveawayData) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }
    
    let description = ''
    
    if (type === 'description_1') {
      description = generateDescription1(giveawayData)
    } else if (type === 'description_2') {
      description = generateDescription2(giveawayData)
    } else {
      return NextResponse.json(
        { error: 'Invalid description type' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ description })
  } catch (error) {
    console.error('Error generating description:', error)
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    )
  }
}

