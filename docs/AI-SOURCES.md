# Public sources for Naya

1. In `backend/.env`, set `SGAI_API_KEY` and list the exact hosts you approve in `SGAI_ALLOWED_HOSTS`, separated by commas. Keep the API key on the server.
2. From the project root run `npm run ai:import -w backend -- https://approved-host.org/public-guide`, replacing the URL with an approved public page. The resulting candidate JSON is written to the backend directory. Each import calls the hosted ScrapeGraphAI API. [Scrape API documentation](https://docs.scrapegraphai.com/services/scrape)
3. Review the imported content for accuracy and relevance. Save only the excerpts approved for publication in a separate JSON file. Use up to 100 entries, with a maximum of 1,800 characters per excerpt. Include keywords in the languages users are likely to ask in.

```json
[
  {
    "title": "Example consultation guide",
    "url": "https://approved-host.org/public-guide",
    "content": "Replace this example with a reviewed excerpt from the page.",
    "keywords": ["first consultation", "mudhal consultation", "முதல் ஆலோசனை"]
  }
]
```

4. Set `NAYA_KNOWLEDGE_FILE` to the absolute path of that file in `backend/.env`. Configure the existing `LLM_API_KEY` and restart the backend after changing environment settings. Ask a question that contains a configured keyword and check **Related sources** beneath the reply.

The importer sends a public URL and extraction options. Chat retrieves up to two reviewed excerpts locally and passes them to the existing model. Emergency handling and the demo fallback continue to use their existing paths. Source links appear in live replies. Saved conversations retain the reply text.
