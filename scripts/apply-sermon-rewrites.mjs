#!/usr/bin/env node
/* eslint-disable no-console */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERMONS_PATH = join(__dirname, '../assets/data/sermons.js');

const { SERMONS } = await import(pathToFileURL(SERMONS_PATH).href);

const stats = { applied: 0, failures: [] };

function getPanel(day, label) {
  const sermon = SERMONS.find((s) => s.day === day);
  if (!sermon) throw new Error(`Day ${day} not found`);
  const panel = sermon.panels.find((p) => p.label === label);
  if (!panel) throw new Error(`Day ${day} panel "${label}" not found`);
  return panel;
}

function setBody(day, label, body, desc) {
  getPanel(day, label).body = body;
  stats.applied++;
  console.log(`✓ ${desc}`);
}

function setPracticeToday(day, practiceToday, desc) {
  getPanel(day, 'The Landing').practiceToday = practiceToday;
  stats.applied++;
  console.log(`✓ ${desc}`);
}

function requireReplace(day, label, oldText, newText, desc) {
  const panel = getPanel(day, label);
  if (!panel.body.includes(oldText)) {
    throw new Error(`[${desc}] Old text not found in Day ${day} ${label}`);
  }
  panel.body = panel.body.replace(oldText, newText);
  stats.applied++;
  console.log(`✓ ${desc}`);
}

function requireCut(day, label, text, desc) {
  requireReplace(day, label, text, '', desc);
  const panel = getPanel(day, label);
  panel.body = panel.body.replace(/\n{3,}/g, '\n\n').trimEnd();
}

// ─── CRITICAL FIXES ─────────────────────────────────────────────────────────

setBody(
  8,
  'The Landing',
  `[name], Horatio wrote those words in a ship's cabin.

Over the Atlantic. Over the place where his four daughters drowned twelve minutes after the ship went down.

He didn't write it when things got better.

He wrote it from inside the worst moment of his life.

*Whatever my lot — it is well.*`,
  'CRITICAL Day 8 Landing FULL REWRITE',
);

setPracticeToday(
  39,
  `Remember [name] — the fear John describes is specifically the fear of punishment — the belief that God is against you.\n\nToday — come to God without bracing. Without the defensive posture.\n\nYou are not walking into a courtroom. You're walking home.`,
  'CRITICAL Day 39 practiceToday fix',
);

// ─── HOOK REWRITES (28) ─────────────────────────────────────────────────────

const hookRewrites = [
  [2, `You sat down to pray.

Nothing came out.

Not words. Not feelings. Just — nothing.

**And you stayed there anyway.**

That counts. Paul says so.`],
  [3, `Zacchaeus climbed a tree to see Jesus.

Not to meet Him. Not to talk to Him.

**Just to see Him from a safe distance.**

Jesus stopped under the tree and looked up.

*Zacchaeus — come down. I'm coming to your house today.*`],
  [4, `Job lost everything in a single day.

His children. His property. His health.

**He had done nothing wrong.**

The text says so directly — *blameless and upright, a man who feared God.*

And everything went wrong anyway.`],
  [5, `Peter swore he would never deny Jesus.

That same night — three times — he said he didn't know Him.

**The third time a rooster crowed and Peter remembered.**

He went outside and wept bitterly.

*That's where this story starts.*`],
  [6, `The son had a speech prepared.

He had rehearsed it the whole way home — every word of it, all the way back from the far country.

*I am no longer worthy to be called your son. Make me like one of your hired servants.*

**He never got to finish it.**`],
  [7, `Jeremiah wrote this letter to people in exile.

Not free people planning their futures.

**Captives. In a foreign city. With no timeline for going home.**

*Build houses. Plant gardens. Seek the peace of the city.*

He was telling them to put down roots in the place they never wanted to be.`],
  [11, `*Come to me all who are weary and burdened.*

Jesus said this to people who were exhausted by religion.

By rules. By requirements. By the weight of trying to be enough.

**He didn't say — try harder.**

*He offered a different yoke entirely.*`],
  [13, `A father brought his son to the disciples.

The boy had been seized by convulsions since childhood.

The disciples couldn't help.

Jesus came down from the mountain.

The father looked at Him and said — *if you can do anything — please help us.*

**If you can.**

Jesus didn't rebuke the doubt.

*He healed the boy anyway.*`],
  [17, `Imagine getting a gift and trying to pay the giver back.

Not because they asked you to.

**Because receiving it for free felt wrong.**

That is what most people do with grace.

*It has already been given. They are still trying to earn it.*`],
  [19, `Lamentations was written in the ruins of Jerusalem.

The city had been destroyed. Everything was gone.

And Jeremiah wrote — **His mercies are new every morning.**

Not someday. Not when the ruins are cleared.

*Every morning. Including this one.*`],
  [23, `Paul had a thorn in his flesh.

He never tells us what it was. Just that it was painful enough that he begged God three times to remove it.

**God said no.**

*My grace is sufficient for you. My power is made perfect in weakness.*

That is the opposite of helping yourself first.`],
  [26, `Psalm 46 was written during a catastrophe.

Nations in uproar. Kingdoms falling. The earth giving way.

**In the middle of all of it — one line.**

*Be still and know that I am God.*

Not — wait until it calms down. Be still. *Now.*`],
  [28, `David wrote — *taste and see that the Lord is good.*

He wrote it after pretending to be insane to escape a king who wanted to kill him.

**Not from comfort. From a corner.**

The invitation to taste is not from someone who had an easy life.

*It is from someone who had tested it in the worst conditions and still came back with the same answer.*`],
  [29, `A shepherd had a hundred sheep.

One went missing.

He left the ninety-nine and went looking.

**Not to the edge of the field.**

*Until he found it.*`],
  [33, `Psalm 88 ends in darkness.

*Darkness is my closest friend* — that is the final line.

No resolution. No turn toward hope. No light at the end.

**And it is in the Bible.**

Placed there on purpose. As an honest record of what faith can look like on the worst days.`],
  [36, `The night before the cross Jesus prayed in the garden.

*My Father — if it is possible — may this cup be taken from me.*

He had a preference. He said so honestly.

**And then He said — yet not as I will. But as You will.**

That is surrender. Not the absence of preference. The release of the outcome.`],
  [48, `The prayers have been going up for a while now.

And nothing seems to be coming back.

Not silence like peace. Silence like a ceiling.

**Does He actually hear?**

Not in the abstract.

*Does He hear mine?*`],
  [50, `Paul named the real enemy from a prison cell.

Not the Romans who put him there. Not the religious leaders who opposed him.

*Against rulers. Against authorities. Against the powers of this dark world.*

**The real battle was somewhere most people aren't looking.**

And pretending it doesn't exist makes you easier to defeat.`],
  [53, `David wrote this psalm when the Philistines had seized him.

Real enemies. Real danger. Real reasons to be afraid.

He didn't write — *because I trust God I am never afraid.*

He wrote — ***when I am afraid — I put my trust in You.***

*The fear and the trust in the same sentence.*`],
  [54, `*The Lord is my shepherd — I shall not want.*

The Hebrew word translated *want* means *lack.*

**Which is a different claim entirely.**

Not — I will have everything I desire.

*I will not lack what I actually need.*

David knew the difference. He had been both a shepherd and a sheep.`],
  [61, `Paul wrote *do not be anxious about anything* from prison.

He had been beaten, shipwrecked, imprisoned multiple times.

**He was not telling people to pretend anxiety wasn't real.**

He had more reasons to be anxious than almost anyone reading this.

*He was prescribing a practice. Not commanding a feeling.*`],
  [62, `*While we were still sinners — Christ died for us.*

Not after.

Not when we were trying harder.

**While.**

That word is doing everything in that sentence.

*The timing is the whole argument.*`],
  [65, `*Offer your bodies as a living sacrifice — holy and pleasing to God.*

Paul doesn't say — this is one form of worship.

He says — **this is your true and proper worship.**

The body. Daily. All of it.

*Monday morning included.*`],
  [68, `The word *so* in John 3:16 is the Greek word *houtos.*

It means — in this way. To this extent.

**The giving is the definition of the loving.**

God didn't just love the world. God loved it *like this* —

*that He gave His one and only Son.*`],
  [71, `Jesus looked at a crowd of ordinary people.

Tired people. Struggling people. People who didn't have it together.

**And He said — blessed.**

*Blessed are the poor in spirit.*

Not the confident. Not the ones who had figured it out.

*The empty ones.*`],
  [74, `You got close. Then missed a day.

Then it had been a week and starting over felt embarrassing.

**So you waited until Monday. Then the first of the month. Then the new year.**

Jeremiah wrote from the ruins of everything.

*His mercies are new every morning.*

Not every Monday. *Every morning.*`],
  [79, `James wrote — *humble yourselves before the Lord and He will lift you up.*

He wrote it after describing people grasping for status and recognition.

Fighting. Striving. Trying to force outcomes.

**His prescription wasn't — try harder.**

*Stop trying to do God's job.*`],
  [83, `Some days the feelings are there. Worship moves you. Prayer feels close.

Some days nothing comes.

**And on those days the thought creeps in — if I can't feel it, maybe it isn't real.**

Paul had a different framework.

*We live by faith. Not by sight.*

Not by feeling either.`],
  [86, `You've read it long enough to notice things that don't seem to fit together.

Things that seem to contradict. Passages that are hard to explain.

**And the question underneath everything is — is this actually true?**

Not a weak question. The most important one.

*Bring it directly. The Bible has survived two thousand years of it.*`],
];

for (const [day, body] of hookRewrites) {
  setBody(day, 'The Hook', body, `Hook rewrite Day ${day}`);
}

// ─── PANEL FIXES (47) ───────────────────────────────────────────────────────

requireCut(1, 'The Landing', '\n\n*He was never not there.*', 'Day 1 Landing cut');
requireCut(2, 'The Landing', '\n\nYou never did have to know what to say.', 'Day 2 Landing cut');
requireReplace(
  3,
  'The Turn',
  'And Jesus stopped for him anyway. Called him by name.',
  'And Jesus stopped for him. Called him by name.',
  'Day 3 Turn remove second anyway',
);
requireCut(4, 'The Landing', " That's not nothing. That's everything.", 'Day 4 Landing cut');
requireReplace(
  7,
  'The Turn',
  `Most people want God to change their circumstances.

*God keeps showing up in the middle of them.*

He didn't extract the Israelites immediately. He said — build a life where you are. I know where you are.

**The plans He has for you are not suspended until your situation improves.**

They are operating right now.

*In the middle of whatever Babylon you're living in.*`,
  `Jeremiah wasn't telling them to pretend they weren't in exile.

He was telling them to live fully in the place they were — because God was already there.

**Not waiting for the rescue. Present in the captivity.**`,
  'Day 7 Turn replace',
);
setBody(
  9,
  'The Hook',
  `*Be still and know that I am God.*

This was written during a catastrophe.

**Nations in uproar. Kingdoms falling. Mountains crumbling into the sea.**

Not a verse about calm mornings.

*A command given in the middle of collapse.*`,
  'Day 9 Hook replace opening',
);
requireReplace(
  9,
  'The Turn',
  'In the middle of the noise — in the middle of the uproar —',
  'In the middle of the noise —',
  'Day 9 Turn cut uproar repetition',
);
requireCut(10, 'The Landing', '\n\n*And He knows exactly where you\'re standing right now.*', 'Day 10 Landing cut');
requireCut(11, 'The Landing', '\n\n*You don\'t have to carry this alone.*', 'Day 11 Landing cut');
requireReplace(
  12,
  'The Turn',
  `This story is not in scripture to show what God does with extraordinary people.

**It's in scripture to show what He does with ordinary ones who stop pretending.**`,
  `David wrote Psalm 51 after the worst year of his life.

**It's in scripture to show what He does with ordinary ones who stop pretending.**`,
  'Day 12 Turn cut opening',
);
requireCut(13, 'The Turn', '\n\n**Certainty is not the requirement for faith.**', 'Day 13 Turn cut');
requireCut(
  13,
  'The Landing',
  `\n\nIt's one of the most honest prayers in scripture.

*And it worked.*`,
  'Day 13 Landing cut last two lines',
);
setBody(14, 'The Landing', `[name], not to condemn you. To find you.`, 'Day 14 Landing trim');
requireCut(
  16,
  'The Turn',
  `\n\nIt means grace is not reserved for people who have done reasonably bad things.`,
  'Day 16 Turn cut',
);
setBody(
  18,
  'The Hook',
  `Have you ever felt God go quiet?

Not peaceful quiet.

**The kind where you're reaching and nothing comes back.**

*Where did He go?*

Or the harder question — *was He ever there?*`,
  'Day 18 Hook rhythm fix',
);
requireCut(19, 'The Turn', '\n\n**It is already here.**', 'Day 19 Turn cut');
requireCut(20, 'The Turn', ' He receives you.', 'Day 20 Turn cut');
setBody(
  21,
  'The Hook',
  `You're not at the beginning of this anymore.

And you can't see the end yet.

**You're just in it.**

Isaiah wrote about people in exactly this place.

*They will soar. They will run. They will walk and not faint.*

He listed them in the wrong order on purpose.`,
  'Day 21 Hook replace',
);
setBody(
  21,
  'The Turn',
  `The promise is not that the waiting ends quickly.

**It is that the waiting is not wasted.**

The people who walk without fainting — who stay in the ordinary days without collapsing — those are the ones Isaiah calls strong.

*That is the victory being offered.*`,
  'Day 21 Turn replace',
);
setBody(
  21,
  'The Landing',
  `[name], walking without fainting is the miracle.

Not soaring. Not running. Just — staying in it, one day at a time, not collapsing under what you cannot yet see the end of.

*Isaiah called that strength.*`,
  'Day 21 Landing rewrite',
);
requireCut(
  22,
  'The Story',
  `**Before He demonstrated any power — He sat in the pain.**`,
  'Day 22 Story cut duplicate',
);
requireCut(
  22,
  'The Turn',
  `\n\nWhich means when you are in pain — God is not watching from somewhere else.

*He is standing where you are standing. He is weeping too.*`,
  'Day 22 Turn cut last two lines',
);
setBody(
  23,
  'The Turn',
  `Paul stopped asking for the thorn to be removed.

Not because he gave up. Because the answer changed the prayer.

**My grace is sufficient. My power is made perfect in weakness.**

Which means the weakness was never the problem.

*It was the access point.*`,
  'Day 23 Turn replace',
);
requireCut(23, 'The Landing', '\n\nYou never did have to help yourself first.', 'Day 23 Landing cut');
requireReplace(
  25,
  'The Turn',
  `I'm writing this because I want whoever is reading this to know something.

The season you're in right now — the one that feels like it's never going to turn —`,
  `There were a hundred moments where leaving would have been easy.

The season you're in right now — the one that feels like it's never going to turn —`,
  'Day 25 Turn cut opening',
);
requireCut(25, 'The Landing', `\n\n*He's been in the small things all along.*`, 'Day 25 Landing cut');
setBody(
  27,
  'The Turn',
  `You don't get to see the end before you decide to stay.

**Ruth didn't.**

She chose Naomi. She chose the unknown country. She chose before she knew what it would mean.

*And the story unfolded from there.*`,
  'Day 27 Turn replace',
);
requireCut(27, 'The Landing', '\n\nShe just stayed.', 'Day 27 Landing cut second She just stayed');
setBody(
  28,
  'The Landing',
  `[name], the invitation is to taste it.

Not to understand it perfectly first. Not to resolve every doubt before coming close.

David wrote *taste and see* from the worst corner of his life — and what he found there was still good.

*Come and see. That's the whole invitation.*`,
  'Day 28 Landing replace',
);
requireReplace(
  30,
  'The Story',
  `The moment Jesus stopped under the sycamore tree is one of the most quietly remarkable moments in the Gospels.

`,
  '',
  'Day 30 Story cut opening',
);
setBody(
  31,
  'The Turn',
  `Paul is not saying Christ will help you accomplish everything you set out to do.

**He is saying Christ will sustain you through everything you go through.**

The strength is not for winning.

*It is for remaining whole when the conditions are against you.*

Available in every condition. Not just the ones where you come out on top.`,
  'Day 31 Turn replace',
);
requireCut(32, 'The Turn', '\n\n*Rest. The journey is too much for you to carry like this.*', 'Day 32 Turn cut');
requireCut(
  33,
  'The Turn',
  `\n\nGod does not require you to be okay before you come to Him.

He received Psalm 88.

*He will receive yours.*`,
  'Day 33 Turn cut last two sentences',
);
requireCut(
  34,
  'The Turn',
  `\n\nHe sees what would break you if you arrived before you'd become the person who can hold what He's giving you.`,
  'Day 34 Turn cut',
);
requireReplace(
  35,
  'The Turn',
  `The most honest line in the hymn is not the triumphant opening.

It is the confession buried in the third verse.

Robinson didn't write that as a general observation.`,
  `Robinson didn't write *prone to wander* as a general observation.`,
  'Day 35 Turn cut opening',
);
requireCut(
  36,
  'The Turn',
  `\n\nThat single act of surrender changed the course of everything.

*Yours might too.*`,
  'Day 36 Turn cut',
);
requireCut(37, 'The Landing', '\n\nThat is the pattern God uses.', 'Day 37 Landing cut');
requireReplace(
  39,
  'The Landing',
  `[name], you don't have to approach God braced for impact.

The fear John describes is specifically the fear of punishment — and he says that fear was already answered at the cross, the verdict already settled, before you ever worked up the courage to come close.

The punishment was already taken.

*Come without fear.*`,
  `[name], you don't have to approach God braced for impact.

The fear John describes — the fear that God is against you — was answered at the cross before you ever worked up the courage to come close.

The verdict is already in.

*You are not the defendant anymore.*`,
  'Day 39 Landing replace close',
);
requireReplace(
  40,
  'The Story',
  'Not to explain. *To confront Job with the vastness of what he didn\'t know.*',
  'God didn\'t come to explain. He came to confront Job with the vastness of what he didn\'t know.',
  'Day 40 Story grammar fix',
);
setBody(
  41,
  'The Turn',
  `Jesus said — *because you have seen me, you have believed.*

That is usually quoted as a rebuke of Thomas.

**It is grace toward everyone who comes after him.**

Thomas needed proof. Jesus gave him proof.

You haven't seen the wounds.

*And Jesus says — your belief without seeing is a blessing. Not inferior. A blessing.*`,
  'Day 41 Turn replace',
);
requireCut(
  42,
  'The Hook',
  `\n\nGod directly addresses this feeling in Isaiah.

*And the answer He gives is more specific than most people expect.*`,
  'Day 42 Hook cut',
);
requireCut(42, 'The Turn', '\n\n*Every moment of the waiting — He sees your name.*', 'Day 42 Turn cut');
requireReplace(
  43,
  'The Turn',
  `I'm writing this because I didn't walk away.

And I've been trying to figure out why — because I can't fully credit myself with staying.

There were a hundred moments where leaving would have been easy.`,
  `There were a hundred moments where leaving would have been easy.`,
  'Day 43 Turn cut opening',
);
setBody(
  44,
  'The Hook',
  `Peter thought he was being generous — seven times was more than the religious law required.

**Jesus said seventy-seven times.**

Which is not a number to count to.

*It is a direction to move in.*`,
  'Day 44 Hook replace',
);
setBody(
  44,
  'The Turn',
  `Seventy-seven times is not a number.

**It is a direction.**

Toward forgiveness. Continuously. Without keeping score.

Not because what they did was acceptable.

Because you have been forgiven a debt you could never repay — and forgiveness is not a feeling that arrives.

*It is a decision you keep making in a direction you don't yet feel.*`,
  'Day 44 Turn replace',
);
requireReplace(
  45,
  'The Turn',
  `Here is the detail that changes everything.

Jesus was already walking toward the boat when Peter got out.`,
  `Jesus was already walking toward the boat when Peter got out.`,
  'Day 45 Turn cut opening',
);
requireCut(
  46,
  'The Turn',
  `\n\n**And it produces a specific kind of joy** — the kind that doesn't depend on what you can see.`,
  'Day 46 Turn cut',
);
setBody(
  47,
  'The Hook',
  `*Cast all your anxiety on him because he cares for you.*

Peter wrote this.

**The man who denied Jesus three times in a single night because he was afraid.**

He knew what anxiety could make a person do.

*That's who wrote this verse.*`,
  'Day 47 Hook replace opening',
);
requireReplace(
  47,
  'The Story',
  'Not — slowly release. Not — try to worry a little less.',
  'Not slowly release. Not try to worry a little less. *Throw it.*',
  'Day 47 Story grammar fix',
);
requireCut(48, 'The Landing', ' That includes you.', 'Day 48 Landing cut');
requireReplace(
  49,
  'The Story',
  `Psalm 23 is the most famous psalm. But the moment that matters most is in verse 4.

`,
  '',
  'Day 49 Story cut opening',
);
setBody(
  50,
  'The Turn',
  `Understanding that the battle is spiritual changes how you fight it.

You stop exhausting yourself fighting people and circumstances you cannot control.

**You start using the weapons that actually work.**

Truth against lies. Prayer against darkness. The Word against the thought that keeps saying it's hopeless.

The battle is real. The resistance is real.

*But you are armed. And you are not in this alone.*`,
  'Day 50 Turn replace',
);
requireCut(51, 'The Turn', '\n\n*It is not the end.*', 'Day 51 Turn cut');
requireCut(
  53,
  'The Turn',
  `\n\nWhat they did with it — *who they turned to in it* — is what defined them.`,
  'Day 53 Turn cut',
);
setBody(
  54,
  'The Turn',
  `The shepherd provides what the sheep needs.

Green pastures when hungry. Still water when thirsty. Presence in the dark valley.

**A table set in the presence of enemies — not after they leave. While they're still standing there.**

*It was never about the threat disappearing first.*`,
  'Day 54 Turn replace',
);
requireReplace(
  55,
  'The Turn',
  'Not your effort applied to the problem.\n\nThe rescue that comes from outside you.',
  'Not your effort applied to the problem — but the rescue that comes from outside you entirely.',
  'Day 55 Turn grammar fix',
);
requireCut(55, 'The Landing', " That's available to you right now.", 'Day 55 Landing cut');
requireCut(
  56,
  'The Turn',
  `\n\nThat prayer — made by a blind man in the 6th century — is the prayer for anyone whose vision has been clouded by everything else.`,
  'Day 56 Turn cut last sentence',
);
requireReplace(
  57,
  'The Hook',
  `This is the fear underneath a lot of other fears.

Not just — what if things go wrong.

`,
  '',
  'Day 57 Hook cut opening',
);
requireCut(
  59,
  'The Hook',
  `One is a promise about what He will do.

The other is a statement about **what He is.**

`,
  'Day 59 Hook cut',
);
requireCut(
  59,
  'The Turn',
  `\n\n**He is what He claims to be. And He is available to you right now.**`,
  'Day 59 Turn cut',
);
requireReplace(
  60,
  'The Landing',
  `Who couldn't leave. Who had nowhere else to go.`,
  `She stayed because she couldn't leave. Because the tomb — even empty — was the last place she had been close to Him.`,
  'Day 60 Landing grammar fix',
);
requireReplace(
  61,
  'The Turn',
  'From your shoulders — to the God who can actually do something with it.',
  'But the weight shifts — from your shoulders to the God who can actually carry it.',
  'Day 61 Turn grammar fix',
);
requireReplace(
  62,
  'The Landing',
  '*While you were still. It\'s already there.*',
  '*While you were still a sinner. It\'s already there.*',
  'Day 62 Landing grammar fix',
);
requireReplace(
  63,
  'The Turn',
  `I'm writing this because I was wrong about the limit.

There isn't one.`,
  `There isn't one.`,
  'Day 63 Turn cut opening',
);
requireReplace(
  64,
  'The Turn',
  `Not because tomorrow doesn't matter.

Because you cannot live in tomorrow.`,
  `You cannot live in tomorrow. You can only live in today.`,
  'Day 64 Turn cut opening',
);
requireCut(
  65,
  'The Turn',
  `Paul is not diminishing the music. He is expanding the definition.

`,
  'Day 65 Turn cut',
);
requireCut(66, 'The Turn', 'That is how He tends to work.\n\n', 'Day 66 Turn cut');
requireReplace(
  67,
  'The Story',
  'Frances Havergal once described Fanny — *She is a blind lady whose heart can see splendidly in the sunshine of God\'s love.*',
  'A contemporary poet named Frances Havergal — herself a hymn writer — once described her: *She is a blind lady whose heart can see splendidly in the sunshine of God\'s love.*',
  'Day 67 Story add context',
);
setBody(
  67,
  'The Turn',
  `Most of Fanny's hymns were written in the first person — testimony, petition, personal experience. This one isn't. *To God Be The Glory* is entirely about God. No Fanny in it at all. Just — He is worthy.`,
  'Day 67 Turn clarify',
);
requireCut(69, 'The Landing', '\n\nNothing can separate you from the love of God.', 'Day 69 Landing cut');
requireCut(70, 'The Landing', " That's available to you.", 'Day 70 Landing cut');
setBody(
  72,
  'The Turn',
  `Jesus knew what the next twelve hours held.

The arrest. The trial. The cross.

**And He prayed for you.**

Specifically. For the ones who would come after.

Which means before you ever prayed your first prayer —

*you had already been prayed for.*`,
  'Day 72 Turn replace',
);
setBody(
  74,
  'The Turn',
  `The goal is not the streak.

**The goal is today.**

One day at a time. Not as a performance to maintain but as a single choice to begin again.

The mercy that is new every morning means every morning is a fresh start.

*Just today. That is always enough.*`,
  'Day 74 Turn replace',
);
setBody(
  75,
  'The Hook',
  `*O Lord my God, when I in awesome wonder*
*Consider all the worlds Thy hands have made.*

In 1885 a young Swedish pastor named Carl Boberg was walking home from church when a violent storm came in from the sea.

Lightning. Thunder. Driving rain.

**Then just as quickly — it passed.** The birds returned. The church bells rang across the water.

Boberg stood at his window in the sudden calm and something broke open in him.

*He had no intention of writing a hymn.*`,
  'Day 75 Hook add storm setup',
);
requireCut(76, 'The Turn', '\n\n*Seek first — and the anxiety loosens its grip.*', 'Day 76 Turn cut');
setBody(
  78,
  'The Turn',
  `God doesn't fix everything immediately because He is working toward something that the immediate fix would interrupt.

Paul experienced this firsthand.

Shipwrecks. Beatings. Imprisonment.

**And from inside all of it — he arrived at a conclusion.**

Not — it will be okay someday.

*It is working. Right now. Toward something eternal.*`,
  'Day 78 Turn replace potter/clay',
);
requireReplace(
  80,
  'The Turn',
  `**He always comes to save — just not always the way we're expecting.**`,
  `*Just not the way they expected.*`,
  'Day 80 Turn cut',
);
requireReplace(
  81,
  'The Landing',
  `He didn't give up on him or find someone else.

*He goes after you too.*`,
  `He went after the one who was running, however far that took.

*He goes after you too.*`,
  'Day 81 Landing cut',
);
requireReplace(
  82,
  'The Turn',
  `I'm writing this because the person reading it might be in the part of the story that is before knowing these things.

Where faith feels fragile and doubts feel dangerous.

**I was there.**`,
  `I was there.`,
  'Day 82 Turn cut opening',
);
requireCut(
  82,
  'The Landing',
  `Just this — the telling of it. The things I know now that I didn't know when I started, written down so someone earlier in the story than me could know it's possible to come out the other side.

`,
  'Day 82 Landing cut first telling',
);
setBody(
  83,
  'The Turn',
  `You can believe without feeling it.

The disciples believed in the resurrection before they felt joy about it.

*They believed on the basis of the empty tomb — not on the basis of a feeling.*

The feeling came later. Sometimes much later.

**The faith didn't wait for it.**

*Live by faith. Not by feeling.*`,
  'Day 83 Turn replace',
);
requireReplace(
  85,
  'The Hook',
  `The image is simple. Everyone understands how vines work.

The branch doesn't produce fruit through effort. It doesn't will the grapes into existence.

**It stays connected to the vine.**

And then Jesus said the last four words that most people try very hard not to think about too carefully.

*Apart from me — you can do nothing.*

**Nothing.**`,
  `*I am the vine — you are the branches.*

The branch doesn't produce fruit through effort. It doesn't will the grapes into existence.

**It stays connected to the vine.**

And then Jesus said the last four words that most people try very hard not to think about too carefully.

*Apart from me — you can do nothing.*

**Nothing.**`,
  'Day 85 Hook cut opening',
);
setBody(
  85,
  'The Turn',
  `A branch doesn't try to produce fruit.

It stays connected to the vine.

**And the fruit appears.**

That is the whole model. Not effort — connection.

*Apart from me — you can do nothing.*

Which means the most productive thing you can do today is not try harder.

*It is stay.*`,
  'Day 85 Turn replace',
);
requireReplace(
  86,
  'The Turn',
  `**And the people who have done that — who brought their genuine doubt to the text — have not generally come away with less.**

Because the Bible has survived two thousand years of serious questioning.

It has been read by skeptics and scholars and ordinary people in crisis.

*Not despite the hard questions. Through them.*`,
  `The people who have done that — who brought their genuine doubt to the text and stayed in the investigation — have not walked away with less.

**The Bible has survived two thousand years of serious questioning.**

By skeptics. By scholars. By ordinary people in real crisis.

*It is still here. Still being read. Still changing people.*`,
  'Day 86 Turn replace hedging',
);
setBody(
  87,
  'The Turn',
  `Rest is not the absence of faith.

**It is an act of trust.**

The decision to stop striving — to put down the weight — is not spiritual failure.

It is obedience to a God who designed human beings to need rest.

Jesus withdrew to lonely places. The disciples were told to come away and rest.

*The work will continue tomorrow. Today — rest.*`,
  'Day 87 Turn replace',
);
requireReplace(
  88,
  'The Story',
  'The man who had been hunting Christians down. Then used to spread the message of the risen Jesus across the known world.',
  'The man who had been hunting Christians down was now being used to spread the message of the risen Jesus across the known world.',
  'Day 88 Story grammar fix',
);

// ─── SERIALIZE ──────────────────────────────────────────────────────────────

function templateLiteral(value) {
  if (value.includes('`')) {
    throw new Error('Cannot serialize value containing backtick');
  }
  return `\`${value}\``;
}

function serializePanel(panel, indent) {
  const i = ' '.repeat(indent);
  const ii = ' '.repeat(indent + 2);
  const lines = [`${i}{`];
  lines.push(`${ii}id: ${panel.id},`);
  lines.push(`${ii}label: ${templateLiteral(panel.label)},`);
  lines.push(`${ii}isPrayer: ${panel.isPrayer},`);
  lines.push(`${ii}body: ${templateLiteral(panel.body)},`);

  if (panel.practiceToday) {
    lines.push(`${ii}practiceToday: ${templateLiteral(panel.practiceToday)},`);
  }

  lines.push(`${i}},`);
  return lines.join('\n');
}

function serializeSermon(sermon, indent = 2) {
  const i = ' '.repeat(indent);
  const lines = [`${i}{`];
  lines.push(`${i}  day: ${sermon.day},`);
  lines.push(`${i}  type: ${templateLiteral(sermon.type)},`);
  lines.push(`${i}  title: ${templateLiteral(sermon.title)},`);
  lines.push(`${i}  scripture: ${templateLiteral(sermon.scripture)},`);
  lines.push(`${i}  illustrationPrompt: ${templateLiteral(sermon.illustrationPrompt)},`);
  lines.push(`${i}  teaser: ${templateLiteral(sermon.teaser)},`);
  lines.push(`${i}  panels: [`);

  for (const panel of sermon.panels) {
    lines.push(serializePanel(panel, indent + 4));
  }

  lines.push(`${i}  ],`);
  lines.push(`${i}},`);
  return lines.join('\n');
}

const output = `export const SERMONS = [\n${SERMONS.map((s) => serializeSermon(s)).join('\n\n')}\n];\n`;

writeFileSync(SERMONS_PATH, output, 'utf8');

const lineCount = output.split('\n').length;

console.log('\n────────────────────────────────────────');
console.log(`Applied: ${stats.applied} changes`);
console.log(`Failures: ${stats.failures.length}`);
console.log(`Updated file line count: ${lineCount}`);

if (stats.failures.length > 0) {
  console.error('\nFailures:');
  for (const f of stats.failures) console.error(`  - ${f}`);
  process.exit(1);
}

if (stats.applied !== 77) {
  console.warn(`\nWarning: expected 77 changes, applied ${stats.applied}`);
}
