# Publishing Closer’s weekly video

One-time setup: apply `supabase/migrations/20261005010000_community_videos.sql` to the app’s Supabase project. The app reads only published videos. App users cannot edit this table.

Each week:

1. Upload the finished video to your video host (for example, your YouTube channel).
2. Upload a landscape thumbnail to a public image URL. A 16:9 image at 1200px wide works well; keep the subject near the center because the card crops to fill.
3. Open Supabase → Table Editor → **community_videos** → Insert row.
4. Enter **title**, **watch_url** (the HTTPS watch page), and **thumbnail_url** (direct HTTPS image URL).
5. Optionally add **synopsis**, **instagram_url**, **tiktok_url**, and **youtube_url**. Social links must point to this video’s individual posts. Leave them empty to keep those icons as inactive placeholders.
6. Set **published_at** to the release time and **is_published** to true. Future dates schedule the card; false keeps a draft hidden.

The most recently published video becomes the Community card when users open Community or return to the app. No app update is needed. The New selector on the video page opens the collection of all published videos, newest first. Selecting a cover displays that film’s hero and synopsis. Tapping the card opens the hosted video in the in-app browser. The video stays on your host rather than increasing the app download size.

To hide a video, set **is_published** to false. The next newest published video appears, or the Coming soon card if none remain. Offline devices retain their last loaded card until they reconnect.

Keep Supabase administrator credentials private. The app uses only the public key and a read-only policy for published content.
