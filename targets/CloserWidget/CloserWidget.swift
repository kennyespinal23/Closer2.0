import CoreText
import SwiftUI
import WidgetKit

// Closer's widgets. The app writes one snapshot of the day (lib/widgetSync.ts) to the shared App Group;
// every widget here reads it. Colour comes from each item's picture; text is that colour mixed with white.

let appGroup = "group.com.espinalcapital.closer"
let snapshotKey = "closer.widget.snapshot"

// MARK: - Snapshot

struct Snapshot: Codable {
  struct Step: Codable { let key: String; let headline: String; let title: String; let label: String; let art: String; let tint: String }
  struct Verse: Codable { let text: String; let reference: String; let book: String; let tint: String }
  struct Night: Codable { let enabled: Bool; let hour: Int; let minute: Int; let doneDate: String? }
  let date: String
  let streak: Int
  let keptToday: Bool
  let stepsDone: Int
  let stepsTotal: Int
  let step: Step?
  let verse: Verse?
  let night: Night?

  static func load() -> Snapshot? {
    guard let raw = UserDefaults(suiteName: appGroup)?.string(forKey: snapshotKey), let data = raw.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(Snapshot.self, from: data)
  }

  static let preview = Snapshot(date: dayString(Date()), streak: 6, keptToday: false, stepsDone: 1, stepsTotal: 2,
    step: Step(key: "prayer", headline: "Pray it back", title: "Built Before the Rain", label: "Step 2 of 2", art: "two-builders", tint: "#22A092"),
    verse: Verse(text: "A bruised reed he will not break.", reference: "Isaiah 42:3", book: "isaiah", tint: "#A47D28"),
    night: Night(enabled: true, hour: 21, minute: 0, doneDate: nil))
}

func dayString(_ date: Date) -> String {
  let f = DateFormatter(); f.calendar = Calendar(identifier: .gregorian); f.locale = Locale(identifier: "en_US_POSIX"); f.dateFormat = "yyyy-MM-dd"
  return f.string(from: date)
}

/// What a widget shows at one moment: the snapshot read against the clock.
struct Day {
  let snap: Snapshot?
  let now: Date

  var today: String { dayString(now) }
  /// The snapshot was written today. If not, the day hasn't been opened yet.
  var fresh: Bool { snap?.date == today }
  var streak: Int {
    guard let s = snap else { return 0 }
    if fresh { return s.streak }
    // Kept yesterday, so the streak is still alive until today ends.
    let yesterday = dayString(Calendar.current.date(byAdding: .day, value: -1, to: now) ?? now)
    return s.date == yesterday && s.keptToday ? s.streak : 0
  }
  var kept: Bool { fresh && (snap?.keptToday ?? false) }
  var nightAt: Date? {
    guard let n = snap?.night, n.enabled else { return nil }
    return Calendar.current.date(bySettingHour: n.hour, minute: n.minute, second: 0, of: now)
  }
  var nightPrayed: Bool { snap?.night?.doneDate == today }
  var isNight: Bool { guard let at = nightAt else { return false }; return now >= at && !nightPrayed }
  var step: Snapshot.Step? { fresh ? snap?.step : nil }
}

// MARK: - Colour

extension Color {
  init(hex: String) {
    let s = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
    var v: UInt64 = 0; Scanner(string: s).scanHexInt64(&v)
    self.init(red: Double((v >> 16) & 0xFF) / 255, green: Double((v >> 8) & 0xFF) / 255, blue: Double(v & 0xFF) / 255)
  }
}

/// The colours one picture gives: a deep ground and three inks, each a tint of the picture's colour.
struct Tone {
  let c: Color, deep: Color, t1: Color, t2: Color, t3: Color
  init(_ hex: String) {
    let base = Self.rgb(hex)
    func mix(_ a: (Double, Double, Double), _ b: (Double, Double, Double), _ t: Double) -> Color {
      Color(red: a.0 + (b.0 - a.0) * t, green: a.1 + (b.1 - a.1) * t, blue: a.2 + (b.2 - a.2) * t)
    }
    c = Color(hex: hex)
    deep = mix(base, (0, 0, 0), 0.5)
    t1 = mix((1, 1, 1), base, 0.12)
    t2 = mix((1, 1, 1), base, 0.34)
    t3 = mix((1, 1, 1), base, 0.54)
  }
  static func rgb(_ hex: String) -> (Double, Double, Double) {
    let s = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
    var v: UInt64 = 0; Scanner(string: s).scanHexInt64(&v)
    return (Double((v >> 16) & 0xFF) / 255, Double((v >> 8) & 0xFF) / 255, Double(v & 0xFF) / 255)
  }
}

let nightTint = "#2033A2"
let flameInk = Color(hex: "#FFF0DC"), flameSoft = Color(hex: "#E8C9A6"), gold = Color(hex: "#FFC93C")

// MARK: - Fonts and art

enum Nunito {
  static var names: [Int: String] = {
    var out: [Int: String] = [:]
    for weight in [700, 800, 900] {
      guard let url = resource("nunito-\(weight)", "ttf"), let provider = CGDataProvider(url: url as CFURL), let font = CGFont(provider) else { continue }
      CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
      if let name = font.postScriptName as String? { out[weight] = name }
    }
    return out
  }()
  static func font(_ size: CGFloat, _ weight: Int) -> Font {
    if let name = names[weight] { return .custom(name, fixedSize: size) }
    return .system(size: size, weight: weight >= 900 ? .black : weight >= 800 ? .heavy : .bold, design: .rounded)
  }
}

func resource(_ name: String, _ ext: String) -> URL? {
  for dir in [nil, "Art", "Fonts", "assets/Art", "assets/Fonts"] {
    if let url = Bundle.main.url(forResource: name, withExtension: ext, subdirectory: dir) { return url }
  }
  return nil
}

func artImage(_ name: String) -> Image? {
  guard let url = resource(name, "jpg"), let ui = UIImage(contentsOfFile: url.path) else { return nil }
  return Image(uiImage: ui)
}

extension View {
  func nunito(_ size: CGFloat, _ weight: Int = 800) -> some View { font(Nunito.font(size, weight)) }
}

// MARK: - Timeline

struct Entry: TimelineEntry { let date: Date; let snap: Snapshot? }

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> Entry { Entry(date: .now, snap: .preview) }
  func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) {
    completion(Entry(date: .now, snap: context.isPreview ? (Snapshot.load() ?? .preview) : Snapshot.load()))
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
    let snap = Snapshot.load(), now = Date(), cal = Calendar.current
    var dates = [now]
    // Turn to night prayer at its hour, and to a new day at midnight.
    if let n = snap?.night, n.enabled, let at = cal.date(bySettingHour: n.hour, minute: n.minute, second: 0, of: now), at > now { dates.append(at) }
    let midnight = cal.startOfDay(for: cal.date(byAdding: .day, value: 1, to: now)!)
    dates.append(midnight)
    completion(Timeline(entries: dates.map { Entry(date: $0, snap: snap) }, policy: .after(midnight.addingTimeInterval(60))))
  }
}

// MARK: - Pieces

struct FlamePill: View {
  let count: Int
  var body: some View {
    HStack(spacing: 3) {
      Image(systemName: "flame.fill").font(.system(size: 11, weight: .bold)).foregroundStyle(LinearGradient(colors: [Color(hex: "#FFD66B"), Color(hex: "#FF5A1E")], startPoint: .top, endPoint: .bottom))
      Text("\(count)").nunito(13, 900).foregroundStyle(Color(hex: "#FFE2C2"))
    }
    .padding(.leading, 7).padding(.trailing, 8).frame(height: 24)
    .background(Capsule().fill(Color.black.opacity(0.36)))
  }
}

struct StepDots: View {
  let done: Int, total: Int
  var body: some View {
    HStack(spacing: 4) { ForEach(0..<max(total, 1), id: \.self) { i in Capsule().fill(i < done ? Color.white : Color.white.opacity(0.25)).frame(width: 16, height: 5) } }
  }
}

/// The painting, faded into its own deep colour from one side.
struct ArtGround: View {
  let art: String, tone: Tone
  var fade: Edge = .bottom
  var body: some View {
    ZStack {
      tone.deep
      if let img = artImage(art) { img.resizable().scaledToFill() }
      LinearGradient(stops: fade == .bottom
        ? [.init(color: tone.deep.opacity(0), location: 0.3), .init(color: tone.deep.opacity(0.94), location: 1)]
        : [.init(color: tone.deep, location: 0.3), .init(color: tone.deep.opacity(0.6), location: 0.55), .init(color: tone.deep.opacity(0), location: 0.8)],
        startPoint: fade == .bottom ? .top : .leading, endPoint: fade == .bottom ? .bottom : .trailing)
    }
  }
}

let flameGround = RadialGradient(colors: [Color(hex: "#6A3A16"), Color(hex: "#2A160C"), Color(hex: "#1A0E08")], center: UnitPoint(x: 0.5, y: 0.7), startRadius: 0, endRadius: 120)

// MARK: - Today widget (step by day, night prayer after dark)

struct TodayView: View {
  let entry: Entry
  @Environment(\.widgetFamily) var family
  var day: Day { Day(snap: entry.snap, now: entry.date) }

  var body: some View {
    switch family {
    case .accessoryRectangular: rect
    case .accessoryInline: Text(day.isNight ? "Night prayer · Lay today down" : day.kept ? "Today, kept" : day.step.map { "\($0.headline) · \($0.label)" } ?? "Read today’s story")
    default: home
    }
  }

  var rect: some View {
    VStack(alignment: .leading, spacing: 1) {
      Text(day.isNight ? "NIGHT PRAYER" : day.kept ? "TODAY, KEPT" : (day.step?.label.uppercased() ?? "TODAY")).nunito(11, 800).opacity(0.75)
      Text(day.isNight ? "Lay today down" : day.kept ? "\(day.streak) days. See you tomorrow." : (day.step?.headline ?? "Read today’s story")).nunito(15, 900).lineLimit(2)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .containerBackground(for: .widget) { Color.clear }
    .widgetURL(URL(string: day.isNight ? "closer://today?night=1" : "closer://today"))
  }

  @ViewBuilder var home: some View {
    if day.isNight { night } else { today }
  }

  // The day's step on its scene.
  var today: some View {
    let s = day.step
    let tone = Tone(s?.tint ?? day.snap?.verse?.tint ?? "#A47D28")
    let art = s.map { "m-\($0.art)" } ?? day.snap?.verse.map { "c-\($0.book)" } ?? "m-creation"
    let headline = day.kept ? "Today, kept" : (s?.headline ?? "Today’s story")
    let sub = day.kept ? "See you tomorrow" : (s?.title ?? "Open Closer to begin")
    let kicker = day.kept ? "\(day.streak) DAYS" : (s?.label.uppercased() ?? day.now.formatted(.dateTime.weekday(.wide)).uppercased())
    let wide = family != .systemSmall
    return ZStack(alignment: .topLeading) {
      VStack(alignment: .leading, spacing: 0) {
        Text(kicker).nunito(11, 800).tracking(0.8).foregroundStyle(tone.t3)
        if family == .systemLarge { Spacer() }
        Text(headline.uppercased()).nunito(family == .systemLarge ? 30 : wide ? 22 : 19, 900).tracking(-0.6).foregroundStyle(tone.t1)
          .lineLimit(2).minimumScaleFactor(0.7).padding(.top, family == .systemLarge ? 0 : 6)
        Text(sub).nunito(13, 700).foregroundStyle(tone.t2).lineLimit(wide ? 1 : 2).padding(.top, 3)
        if family != .systemLarge { Spacer(minLength: 6) }
        HStack(spacing: 8) {
          if day.streak > 0 { FlamePill(count: day.streak) }
          if let snap = day.snap, day.fresh, !day.kept { StepDots(done: snap.stepsDone, total: snap.stepsTotal) }
        }
        .padding(.top, family == .systemLarge ? 12 : 0)
      }
      .frame(maxWidth: wide && family != .systemLarge ? 210 : .infinity, maxHeight: .infinity, alignment: .topLeading)
      .padding(16)
    }
    .containerBackground(for: .widget) { ArtGround(art: art, tone: tone, fade: family == .systemMedium ? .leading : .bottom) }
    .widgetURL(URL(string: "closer://today"))
  }

  // After dark: night prayer, one white button.
  var night: some View {
    let tone = Tone(nightTint)
    let large = family == .systemLarge, small = family == .systemSmall
    return VStack(alignment: .leading, spacing: 0) {
      HStack {
        Text(small ? "NIGHT PRAYER" : "NIGHT PRAYER · 2 MIN").nunito(11, 800).tracking(0.8).foregroundStyle(gold)
        Spacer()
        if day.streak > 0 && !small { FlamePill(count: day.streak) }
      }
      Spacer()
      Text("LAY TODAY DOWN").nunito(large ? 30 : small ? 19 : 22, 900).tracking(-0.8).foregroundStyle(tone.t1).lineLimit(2).minimumScaleFactor(0.7)
      if !small { Text("Say how today felt, then pray before you sleep.").nunito(large ? 14 : 13, 700).foregroundStyle(tone.t2).lineLimit(2).padding(.top, 4) }
      if large {
        HStack(spacing: 6) { Text("Begin").nunito(14, 800); Image(systemName: "arrow.right").font(.system(size: 12, weight: .heavy)) }
          .foregroundStyle(tone.deep).padding(.horizontal, 16).frame(height: 38).background(Capsule().fill(.white)).padding(.top, 12)
      }
    }
    .padding(16)
    .containerBackground(for: .widget) { ArtGround(art: "m-never-leave", tone: tone) }
    .widgetURL(URL(string: "closer://today?night=1"))
  }
}

struct CloserTodayWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "CloserToday", provider: Provider()) { TodayView(entry: $0) }
      .configurationDisplayName("Today")
      .description("Today’s step on its Bible scene. Night prayer after dark.")
      .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryRectangular, .accessoryInline])
      .contentMarginsDisabled()
  }
}

// MARK: - Verse widget

struct VerseView: View {
  let entry: Entry
  @Environment(\.widgetFamily) var family
  var verse: Snapshot.Verse { entry.snap?.verse ?? Snapshot.preview.verse! }

  var body: some View {
    if family == .accessoryRectangular {
      VStack(alignment: .leading, spacing: 1) {
        Text(verse.reference.uppercased()).nunito(11, 800).opacity(0.75)
        Text("“\(verse.text)”").nunito(13, 800).lineLimit(2)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .containerBackground(for: .widget) { Color.clear }
      .widgetURL(URL(string: "closer://today"))
    } else {
      let tone = Tone(verse.tint)
      VStack(alignment: .leading, spacing: 0) {
        Spacer()
        Text("FOR TODAY").nunito(11, 800).tracking(0.8).foregroundStyle(tone.t3)
        Text("“\(verse.text)”").nunito(family == .systemMedium ? 17 : 14, 800).foregroundStyle(tone.t1).lineLimit(family == .systemMedium ? 3 : 4).minimumScaleFactor(0.8).padding(.top, 3)
        Text(verse.reference).nunito(11, 700).foregroundStyle(tone.t3).padding(.top, 3)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
      .padding(14)
      .containerBackground(for: .widget) { ArtGround(art: "c-\(verse.book)", tone: tone) }
      .widgetURL(URL(string: "closer://today"))
    }
  }
}

struct CloserVerseWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "CloserVerse", provider: Provider()) { VerseView(entry: $0) }
      .configurationDisplayName("Verse for today")
      .description("Today’s verse on its book’s painted cover.")
      .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular])
      .contentMarginsDisabled()
  }
}

// MARK: - Streak widget

struct StreakView: View {
  let entry: Entry
  @Environment(\.widgetFamily) var family
  var day: Day { Day(snap: entry.snap, now: entry.date) }

  var body: some View {
    switch family {
    case .accessoryCircular:
      let snap = day.snap
      let progress = day.fresh && (snap?.stepsTotal ?? 0) > 0 ? Double(snap!.stepsDone) / Double(snap!.stepsTotal) : 0
      ZStack {
        AccessoryWidgetBackground()
        Circle().stroke(Color.white.opacity(0.25), lineWidth: 5).padding(3)
        Circle().trim(from: 0, to: progress).stroke(Color.white, style: StrokeStyle(lineWidth: 5, lineCap: .round)).rotationEffect(.degrees(-90)).padding(3)
        VStack(spacing: 0) {
          Image(systemName: "flame.fill").font(.system(size: 11, weight: .bold))
          Text("\(day.streak)").nunito(20, 900)
        }
      }
      .containerBackground(for: .widget) { Color.clear }
      .widgetURL(URL(string: "closer://today"))
    case .accessoryInline:
      Label("\(day.streak) days · \(day.kept ? "today, kept" : "read today’s story")", systemImage: "flame.fill")
        .containerBackground(for: .widget) { Color.clear }
    default:
      VStack(spacing: 2) {
        ZStack(alignment: .bottomTrailing) {
          Image(systemName: "flame.fill").font(.system(size: 46, weight: .bold))
            .foregroundStyle(LinearGradient(colors: [Color(hex: "#FFD66B"), Color(hex: "#FF9A2E"), Color(hex: "#FF5A1E")], startPoint: .top, endPoint: .bottom))
            .opacity(day.streak > 0 ? 1 : 0.4)
          if day.kept {
            Image(systemName: "checkmark").font(.system(size: 10, weight: .black)).foregroundStyle(Color(hex: "#2A1E12"))
              .frame(width: 20, height: 20).background(Circle().fill(Color(hex: "#E9C77A"))).offset(x: 6, y: 0)
          }
        }
        Text("\(day.streak)").nunito(40, 900).tracking(-1.5).foregroundStyle(flameInk).padding(.top, 2)
        Text(day.streak == 0 ? "start today" : day.kept ? "days · today, kept" : "days · keep it lit").nunito(12, 700).foregroundStyle(flameSoft)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .containerBackground(for: .widget) { flameGround }
      .widgetURL(URL(string: "closer://today"))
    }
  }
}

struct CloserStreakWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "CloserStreak", provider: Provider()) { StreakView(entry: $0) }
      .configurationDisplayName("Streak")
      .description("Your days in a row, and whether today is kept.")
      .supportedFamilies([.systemSmall, .accessoryCircular, .accessoryInline])
  }
}

@main
struct CloserWidgets: WidgetBundle {
  var body: some Widget {
    CloserTodayWidget()
    CloserVerseWidget()
    CloserStreakWidget()
    CloserLiveActivityWidget()
  }
}

#Preview(as: .systemMedium) { CloserTodayWidget() } timeline: { Entry(date: .now, snap: .preview) }
