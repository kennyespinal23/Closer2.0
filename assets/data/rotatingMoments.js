// CLOSER — Rotating Moments
// Shown when the app is opened
// Rotates based on time of day and user bookmarks

export const rotatingMoments = {
  // Displayed 5:00 AM – 11:59 AM
  morning: [
    { id: "m01", text: "Thank God for another day.", hasName: false },
    { id: "m02", text: "{name}, you woke up. That's God.", hasName: true },
    { id: "m03", text: "God is good all the time. All the time God is good.", hasName: false },
    { id: "m04", text: "{name}, good morning. God is with you.", hasName: true },
    { id: "m05", text: "I'm awake, I'm alive, I'm blessed. Thank you Lord.", hasName: false },
    { id: "m06", text: "I woke up, thank God.", hasName: false },
    { id: "m07", text: "{name}, today is a gift. Move like it.", hasName: true },
    { id: "m08", text: "Good morning Lord. Order my steps.", hasName: false },
    { id: "m09", text: "Thank you God for this morning.", hasName: false },
    { id: "m10", text: "{name}, get up. God's already working.", hasName: true },
    { id: "m11", text: "New day. New mercy.", hasName: false },
    { id: "m12", text: "{name}, yesterday is gone. This is new.", hasName: true },
    { id: "m13", text: "God didn't bring me this far to leave me.", hasName: false },
    { id: "m14", text: "{name}, you made it to another day.", hasName: true },
    { id: "m15", text: "Pray before you do anything else today.", hasName: false },
    { id: "m16", text: "{name}, God's been good. Even when it's hard.", hasName: true },
    { id: "m17", text: "Every morning is proof God hasn't given up on me.", hasName: false },
    { id: "m18", text: "{name}, God's got today. Trust that.", hasName: true },
    { id: "m19", text: "Thank you Lord for waking me up today.", hasName: false },
    { id: "m20", text: "{name}, God I need you today.", hasName: true },
    { id: "m21", text: "The sun rose today. So did the Son of God.", hasName: false },
    { id: "m22", text: "{name}, good morning. God already knows your day.", hasName: true },
    { id: "m23", text: "Endlessly blessed. Thank you Lord.", hasName: false },
    { id: "m24", text: "{name}, breathe. God's got this.", hasName: true },
    { id: "m25", text: "Directed by God.", hasName: false },
    { id: "m26", text: "{name}, don't forget who woke you up.", hasName: true },
    { id: "m27", text: "If God is for me, who can be against me?", hasName: false },
    { id: "m28", text: "{name}, pray first. Everything else second.", hasName: true },
    { id: "m29", text: "God is the only reason I made it this far.", hasName: false },
    { id: "m30", text: "{name}, good morning. You're not doing this alone.", hasName: true },
  ],

  // Displayed 6:00 PM – 11:59 PM
  evening: [
    { id: "e01", text: "{name}, be easy. Believe God.", hasName: true },
    { id: "e02", text: "Today is done. Thank God for it.", hasName: false },
    { id: "e03", text: "{name}, you made it through today. That's God.", hasName: true },
    { id: "e04", text: "God was there. God was everywhere.", hasName: false },
    { id: "e05", text: "{name}, put it down. Let God handle it tonight.", hasName: true },
    { id: "e06", text: "He will never leave you nor forsake you. — Hebrews 13:5", hasName: false },
    { id: "e07", text: "Come to me, all you who are weary and burdened, and I will give you rest. — Matthew 11:28", hasName: false },
    { id: "e08", text: "I made it through today. Thank you Lord.", hasName: false },
    { id: "e09", text: "{name}, whatever happened today — God saw it all.", hasName: true },
    { id: "e10", text: "Cast all your anxiety on God because he cares for you. — 1 Peter 5:7", hasName: false },
    { id: "e11", text: "God has already blessed you.", hasName: false },
    { id: "e12", text: "{name}, stop replaying today. Give it to God.", hasName: true },
    { id: "e13", text: "The Lord is my shepherd. I have everything I need. — Psalm 23:1", hasName: false },
    { id: "e14", text: "Give God the rest so you can rest.", hasName: false },
    { id: "e15", text: "Night. God's still working.", hasName: false },
    { id: "e16", text: "Prayer is how I fight.", hasName: false },
    { id: "e17", text: "I will lie down and sleep in peace. — Psalm 4:8", hasName: false },
    { id: "e18", text: "{name}, you don't have to solve anything tonight.", hasName: true },
    { id: "e19", text: "God's got the night shift.", hasName: false },
    { id: "e20", text: "{name}, today is finished. You're still standing.", hasName: true },
    { id: "e21", text: "Be still and know that I am God. — Psalm 46:10", hasName: false },
    { id: "e22", text: "Give it to God.", hasName: false },
    { id: "e23", text: "I survived today. Thank you Jesus.", hasName: false },
    { id: "e24", text: "{name}, grace covered every gap today.", hasName: true },
    { id: "e25", text: "The peace of God, which surpasses all understanding. — Philippians 4:7", hasName: false },
    { id: "e26", text: "{name}, hard day. God still good.", hasName: true },
    { id: "e27", text: "Jesus is enough.", hasName: false },
    { id: "e28", text: "{name}, you were not alone today. Not once.", hasName: true },
    { id: "e29", text: "God is the only reason I made it this far.", hasName: false },
    { id: "e30", text: "{name}, good night. Still covered.", hasName: true },
  ],

  // Displayed 12:00 PM – 5:59 PM or when no time data available
  neutral: [
    { id: "n01", text: "Even if I fall, I will rise. The Lord is my light. — Micah 7:8", hasName: false },
    { id: "n02", text: "God is still God. That never changes.", hasName: false },
    { id: "n03", text: "Do not be afraid, for I am with you. — Isaiah 41:10", hasName: false },
    { id: "n04", text: "{name}, wherever you are right now — start there.", hasName: true },
    { id: "n05", text: "Nothing you bring to God is too much.", hasName: false },
    { id: "n06", text: "{name}, Jesus loves you.", hasName: true },
    { id: "n07", text: "Honest is better than perfect. Always.", hasName: false },
    { id: "n08", text: "For Jesus.", hasName: false },
    { id: "n09", text: "For I know the plans I have for you. — Jeremiah 29:11", hasName: false },
    { id: "n10", text: "No performance required.", hasName: false },
    { id: "n11", text: "{name}, come as you are.", hasName: true },
    { id: "n12", text: "{name}, you're not too late. You're not too far.", hasName: true },
    { id: "n13", text: "God is not done with you.", hasName: false },
    { id: "n14", text: "God doesn't keep score.", hasName: false },
    { id: "n15", text: "Trust God's timing.", hasName: false },
    { id: "n16", text: "{name}, you showed up. That's the first thing.", hasName: true },
    { id: "n17", text: "Not a perfect faith. A real one.", hasName: false },
    { id: "n18", text: "God is with us. — Matthew 1:23", hasName: false },
    { id: "n19", text: "God is good. God is faithful.", hasName: false },
    { id: "n20", text: "The tomb is still empty.", hasName: false },
  ],
};

export const getTimeCategory = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 18 && hour < 24) return "evening";
  return "neutral";
};

export const interpolateName = (text, name) => {
  if (!name) return text.replace("{name}, ", "").replace("{name} ", "");
  return text.replace("{name}", name);
};

export const getRandomMoment = (name) => {
  const category = getTimeCategory();
  const pool = rotatingMoments[category];
  const moment = pool[Math.floor(Math.random() * pool.length)];
  return {
    ...moment,
    text: interpolateName(moment.text, name),
  };
};
