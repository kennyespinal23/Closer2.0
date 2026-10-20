import ActivityKit
import SwiftUI
import WidgetKit

// Must match CloserActivityAttributes in modules/closer-live-activity exactly.
struct CloserActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var kicker: String
    var headline: String
    var detail: String
    var progress: Double
    var paused: Bool
    var done: Bool
  }
  var kind: String
  var art: String
  var tint: String
}

/// The art as a small rounded square or circle; falls back to the activity's own colour.
struct ActivityArt: View {
  let attrs: CloserActivityAttributes
  var size: CGFloat
  var circle = false
  var body: some View {
    Group {
      if let img = artImage(attrs.art) { img.resizable().scaledToFill() } else { Color(hex: attrs.tint) }
    }
    .frame(width: size, height: size)
    .clipShape(RoundedRectangle(cornerRadius: circle ? size / 2 : size * 0.27, style: .continuous))
  }
}

/// Night prayer opens night prayer; listening opens the book's player.
func activityURL(_ a: CloserActivityAttributes) -> URL? {
  if a.kind == "night" { return URL(string: "closer://today?night=1") }
  return URL(string: "closer://book/\(a.art.replacingOccurrences(of: "c-", with: ""))/audio")
}

/// Night prayer is gold on its moonlit blue; listening wears the book's cover colour.
func accent(_ attrs: CloserActivityAttributes, _ tone: Tone) -> Color { attrs.kind == "night" ? gold : tone.t1 }

struct ActivityStatusIcon: View {
  let context: ActivityViewContext<CloserActivityAttributes>
  var size: CGFloat = 14
  var body: some View {
    let s = context.state
    let name = s.done ? (context.attributes.kind == "night" ? "moon.stars.fill" : "checkmark") : s.paused ? "pause.fill" : context.attributes.kind == "night" ? "moon.fill" : "waveform"
    Image(systemName: name).font(.system(size: size, weight: .bold)).foregroundStyle(accent(context.attributes, Tone(context.attributes.tint)))
  }
}

struct ActivityBar: View {
  let progress: Double, color: Color, track: Color
  var body: some View {
    GeometryReader { g in
      ZStack(alignment: .leading) {
        Capsule().fill(track)
        Capsule().fill(color).frame(width: max(5, g.size.width * progress))
      }
    }
    .frame(height: 5)
  }
}

struct LockScreenActivity: View {
  let context: ActivityViewContext<CloserActivityAttributes>
  var body: some View {
    let a = context.attributes, s = context.state, tone = Tone(a.tint)
    VStack(alignment: .leading, spacing: 0) {
      HStack(spacing: 12) {
        ActivityArt(attrs: a, size: 52)
        VStack(alignment: .leading, spacing: 2) {
          Text(s.kicker.uppercased()).nunito(11, 800).tracking(0.8).foregroundStyle(a.kind == "night" ? gold : tone.t3)
          Text(s.headline).nunito(19, 900).tracking(-0.4).foregroundStyle(tone.t1).lineLimit(1)
        }
        Spacer(minLength: 8)
        ActivityStatusIcon(context: context, size: 22)
      }
      Text(s.detail).nunito(14, 700).foregroundStyle(tone.t2).lineLimit(2).padding(.top, 12)
      if !s.done { ActivityBar(progress: s.progress, color: a.kind == "night" ? gold : tone.t1, track: Color.white.opacity(0.18)).padding(.top, 12) }
    }
    .padding(16)
    .activityBackgroundTint(Color.clear)
    .background(LinearGradient(colors: [tone.deep.opacity(0.98), Color.black.opacity(0.92)], startPoint: .top, endPoint: .bottom))
    .activitySystemActionForegroundColor(tone.t1)
    .widgetURL(activityURL(a))
  }
}

struct CloserLiveActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: CloserActivityAttributes.self) { context in
      LockScreenActivity(context: context)
    } dynamicIsland: { context in
      let a = context.attributes, s = context.state, tone = Tone(a.tint)
      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) { ActivityArt(attrs: a, size: 44).padding(.leading, 4) }
        DynamicIslandExpandedRegion(.trailing) { ActivityStatusIcon(context: context, size: 20).padding(.trailing, 6).frame(maxHeight: .infinity) }
        DynamicIslandExpandedRegion(.center) {
          VStack(alignment: .leading, spacing: 1) {
            Text(s.kicker.uppercased()).nunito(11, 800).tracking(0.8).foregroundStyle(a.kind == "night" ? gold : tone.t3)
            Text(s.headline).nunito(17, 900).foregroundStyle(.white).lineLimit(1)
          }
          .frame(maxWidth: .infinity, alignment: .leading)
        }
        DynamicIslandExpandedRegion(.bottom) {
          VStack(alignment: .leading, spacing: 8) {
            Text(s.detail).nunito(13, 700).foregroundStyle(Color.white.opacity(0.75)).lineLimit(1)
            if !s.done { ActivityBar(progress: s.progress, color: accent(a, tone), track: Color.white.opacity(0.18)) }
          }
          .padding(.horizontal, 4).padding(.top, 4)
        }
      } compactLeading: {
        ActivityArt(attrs: a, size: 24, circle: true)
      } compactTrailing: {
        ActivityStatusIcon(context: context, size: 13)
      } minimal: {
        ActivityArt(attrs: a, size: 22, circle: true)
      }
      .keylineTint(accent(a, tone))
      .widgetURL(activityURL(a))
    }
  }
}
