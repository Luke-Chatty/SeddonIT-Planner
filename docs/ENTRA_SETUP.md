# Microsoft Entra ID (Azure AD) SSO setup

This guide walks you through registering the Seddon IT Planner app in Microsoft Entra ID so users can sign in with SSO.

## 1. Open App registrations

1. Go to [Azure Portal](https://portal.azure.com).
2. Search for **Microsoft Entra ID** (or **Azure Active Directory**) and open it.
3. In the left menu, select **App registrations**.
4. Click **+ New registration**.

---

## 2. Register the application

1. **Name**: e.g. `Seddon IT Planner` (or any name you prefer).
2. **Supported account types**:
   - **Accounts in this organizational directory only** – only your organisation (single tenant). Use this if only your company should sign in.
   - **Accounts in any organizational directory** – any Azure AD / Entra tenant (multi-tenant).
3. **Redirect URI**:
   - Platform: **Web**.
   - URI: your app’s sign-in callback URL:
     - Production: `https://plan.seddon.co.uk/api/auth/callback/azure-ad`
     - Local dev: `http://localhost:3000/api/auth/callback/azure-ad`
   - You can add both; add production first.
4. Click **Register**.

---

## 3. Note the Application (client) ID and Directory (tenant) ID

On the app’s **Overview** page:

- **Application (client) ID** → use as `AZURE_AD_CLIENT_ID`.
- **Directory (tenant) ID** → use as `AZURE_AD_TENANT_ID`.

(For multi-tenant you can use `common` as tenant ID in config.)

---

## 4. Create a client secret

1. In the left menu, select **Certificates & secrets**.
2. Under **Client secrets**, click **+ New client secret**.
3. **Description**: e.g. `Seddon IT Planner production`.
4. **Expires**: choose a duration (e.g. 24 months); set a reminder to rotate before it expires.
5. Click **Add**.
6. **Copy the Value** immediately (it’s shown only once). This is your `AZURE_AD_CLIENT_SECRET`.

---

## 5. Configure API permissions

1. In the left menu, select **API permissions**.
2. Click **+ Add a permission**.
3. Choose **Microsoft Graph**.
4. Choose **Delegated permissions**.
5. Add:
   - **openid** – sign-in (OpenID Connect).
   - **profile** – name and profile.
   - **email** – user’s email.
6. Click **Add permissions**.
7. If your org requires it, click **Grant admin consent for [Your org]** so users don’t see a consent prompt (optional but recommended for internal apps).

### Optional: Directory search and user photos (Share plan)

Directory search only includes users who are in the configured groups (e.g. **All SCL**, **All Homes**). Profile pictures are shown next to each result.

1. In **API permissions**, click **+ Add a permission**.
2. Choose **Microsoft Graph**.
3. Choose **Application permissions** (not Delegated).
4. Add:
   - **Group.Read.All** – required to resolve group **display names** to IDs when using `AZURE_AD_GROUP_NAMES` (e.g. "All SCL", "All Homes"). If you only use `AZURE_AD_GROUP_IDS`, you can skip this.
   - **GroupMember.Read.All** – list members of those groups for search.
   - **User.Read.All** – read user profile (display name, email, job title) and **profile photo**.
5. Click **Add permissions**.
6. Click **Grant admin consent for [Your org]** (required for application permissions).

Set **AZURE_AD_GROUP_NAMES** to your group display names (exact as in Azure), e.g. `AZURE_AD_GROUP_NAMES="All SCL,All Homes"`. Or set **AZURE_AD_GROUP_IDS** to the group object IDs (no Group.Read.All needed).

Without these, share still works: you can type an email and invite; search will only use database users.

---

## 6. Redirect URI (if you didn’t set it in step 2)

1. Go to **Authentication** in the left menu.
2. Under **Platform configurations**, select **Web** (or add it).
3. Under **Redirect URIs**, ensure you have:
   - `https://plan.seddon.co.uk/api/auth/callback/azure-ad`
   - (Optional) `http://localhost:3000/api/auth/callback/azure-ad` for local dev.
4. Under **Implicit grant and hybrid flows**, leave **ID tokens** unchecked unless you have a specific need.
5. Click **Save**.

---

## 7. Set environment variables

In your deployment (e.g. Dokploy), set these for the Seddon IT Planner app:

| Variable | Value |
|----------|--------|
| `AZURE_AD_CLIENT_ID` | Application (client) ID from step 3 |
| `AZURE_AD_CLIENT_SECRET` | The client secret value from step 4 |
| `AZURE_AD_TENANT_ID` | Directory (tenant) ID from step 3, or `common` for multi-tenant |
| `AZURE_AD_GROUP_NAMES` | Optional. Comma-separated group names for share search (default: `allscl,allhomes`) |
| `NEXTAUTH_URL` | Your app’s full URL, e.g. `https://plan.seddon.co.uk` |
| `NEXTAUTH_SECRET` | A random string (e.g. `openssl rand -base64 32`) |

Restart or redeploy the app after changing env vars.

---

## 8. Test sign-in

1. Open your app (e.g. `https://plan.seddon.co.uk`).
2. You should be redirected to the sign-in page.
3. Click **Sign in with Microsoft** and complete the Entra sign-in.
4. You should land back in the app, signed in.

If you see “redirect_uri mismatch”, double-check the redirect URI in Entra (step 6) and that it exactly matches your app URL and path: `/api/auth/callback/azure-ad`.

---

## Summary checklist

- [ ] App registered in Entra ID.
- [ ] Redirect URI set to `https://<your-domain>/api/auth/callback/azure-ad`.
- [ ] Client secret created and copied.
- [ ] API permissions: openid, profile, email (and admin consent if required). Optional: User.Read.All (Application) for directory search and photos.
- [ ] Env vars set: `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.
- [ ] App restarted/redeployed.
