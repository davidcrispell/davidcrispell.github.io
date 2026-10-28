hi! im David :D, more here -> https://davidcrispell.github.io

## Google Doc content

The homepage bio is loaded on each visit from the Google Doc recorded under
`index.html#now` in `article-sources.json`. `site.js` fetches the Doc's public
plain-text export and renders each non-empty line as a paragraph. The copy in
`index.html` is the fallback if Google cannot be reached.

`serial-depth-and-cot-internalization.html` works differently: it is a static
snapshot. Its Google Doc and last synced revision are recorded in
`article-sources.json`, but updating the Doc does not update that page until the
HTML is synced again.

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
