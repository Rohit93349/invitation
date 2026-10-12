# Aakanksha & Vivek Invitation — Setup and Owner Guide

## What is ready
The invitation and its admin dashboard are complete and backed by this app's database. Open `/admin`, change any field, and press **Save & Publish**. The public invitation uses the new content on its next load without a redeploy.

> Owner security: `/admin` is protected by Firebase Authentication and restricted to `rohitj.badkumar@gmail.com`. No other Firebase account can access the dashboard or admin APIs.

## Simple admin guide
1. Open `/admin` on a phone or computer and sign in with the owner’s Firebase email/password.
2. Use the left/top tabs to edit names, date, couple details, events, venues, gallery, text, music, colours, and RSVP.
3. Upload photos directly; they are compressed to WebP in the browser.
4. Use only a licensed direct MP3. New MP3 uploads must be 5 MB or smaller.
5. Press **Live Preview** to review, then **Save & Publish**.
6. Download **Backup JSON** before major edits. **Restore** returns to the latest saved version.
7. Open RSVP and choose **CSV Export** to download the guest list.

## Firebase owner-login setup
The app uses the Firebase project `akanksha-and-vivek-invitation`. Email/password authentication is active and the sole authorized owner is `rohitj.badkumar@gmail.com`.

1. Go to <https://console.firebase.google.com> and open **akanksha-and-vivek-invitation**.
2. Choose **Build → Authentication → Sign-in method**, enable **Email/Password**, and save.
3. Under **Authentication → Users**, keep `rohitj.badkumar@gmail.com` as the owner account and use a strong private password.
4. To change the password, use **Forgot password?** on `/admin`; Firebase sends the reset email directly.
5. Do not share the owner password. Guests may view the invitation and submit RSVP, but cannot read responses or change content.

Recommended production rules: public read only for the invitation document; authenticated owner write; public RSVP create only; owner-only RSVP read; public media read and owner-only media write.

## Hosting and domain
After Firebase security is activated, install Firebase CLI, run `firebase login`, `firebase init hosting`, select the existing project, use `frontend/dist` as the public directory, enable single-page rewrites, run `yarn build`, then `firebase deploy`. In Firebase Hosting, open **Add custom domain** and follow its DNS steps. This current app also includes a FastAPI API, so production hosting must either keep that API available or migrate the content/RSVP calls to Firebase before using static-only Firebase Hosting.