hi! im David :D, more here -> https://davidcrispell.github.io

## Google Doc content

`article-sources.json` lists the site pages and Google Doc tabs that can be
refreshed. The public site serves static copies, so readers can open them
without Google access. On a linked page, **Refresh from Google Docs** asks for
the site admin password. The Vercel function reads the configured tab and
commits the updated content to `main`; GitHub Pages then publishes the change.
An identical snapshot does not create a commit.

The refresh changes only the content between `google-doc:start` and
`google-doc:end` comments. The site title, authors and navigation are edited in
the HTML. The NLS article also maps its figures to the existing site images.

To activate refresh, deploy this repository to the linked Vercel project
(`davidcrispell-website`) and add these sensitive production environment
variables in Vercel, then redeploy:

| Variable | Value |
| --- | --- |
| `DOC_SYNC_ADMIN_PASSWORD` | The password used in the refresh dialog. |
| `DOC_SYNC_GOOGLE_SERVICE_ACCOUNT` | JSON credentials for a Google Cloud service account. Enable the Google Docs API in its project and share each registered Doc with the service account email as Viewer. The private Doc does not need public link sharing. |
| `DOC_SYNC_GITHUB_TOKEN` | A fine-grained GitHub token limited to `davidcrispell/davidcrispell.github.io` with Contents read/write permission. |

## AI contact key

The public AI contact page is `ai-contact.html`. Its dedicated age recipient is
published in `ai-contact.age.pub`; the private identity is stored as a generic
password in the macOS login Keychain under the service
`ai-contact.davidcrispell.github.io.age`.

Decrypt an attachment locally with:

```sh
scripts/decrypt-ai-contact.sh message.age > message.txt
```

The private identity is not committed to this repository. Make a separate
offline recovery copy from Keychain before treating this as a durable channel.
