export const INDIA_CRISIS_RESOURCES = `
📞 **Immediate mental-health support in India**

• **Tele-MANAS**
  Government of India mental-health support
  Call: 14416
  Alternate: 1800-89-14416
  Available 24/7

• **Vandrevala Foundation**
  Mental-health and crisis support
  Call or WhatsApp: +91 9999 666 555
  Available 24/7
`.trim();


export const MAHARASHTRA_CRISIS_RESOURCES = `
📞 **Mental-health support in Maharashtra**

• **Mpower 1 on 1**
  Mental-health support for concerns such as anxiety,
  low mood, sleep difficulties, relationships, and stress.
  Call: 1800-120-820050
  Toll-free and available 24/7.
  Note: Mpower states that this is a mental-health helpline
  and is not an emergency service.

• **SNEHA Mental Health Helpline**
  Mental-health support in Mumbai.
  Call: +91 89769 94777

• **SNEHA Crisis Helpline**
  Support for women and children facing violence or crisis.
  Call: +91 9892278287
`.trim();


export const INDIA_EMERGENCY_GUIDANCE = `
🚨 If there is immediate physical danger, a suicide attempt,
serious injury, overdose, or another medical emergency,
contact local emergency services or go to the nearest
emergency department immediately.
`.trim();


export function getIndiaCrisisResources({
  includeMaharashtra = true
} = {}) {
  return [
    INDIA_CRISIS_RESOURCES,

    includeMaharashtra
      ? MAHARASHTRA_CRISIS_RESOURCES
      : null,

    INDIA_EMERGENCY_GUIDANCE
  ]
    .filter(Boolean)
    .join("\n\n");
}