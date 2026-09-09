hi! im David :D, more here -> https://davidcrispell.github.io

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
