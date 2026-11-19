# AI / NLP Matching Engine — HireSphere AI
**Lead Developer:** Pranavi Jadhav (PRN: SCFU224040)  
**Specialization:** AI + Resume Processing + Job Matching  
**Technology:** TypeScript NLP • TF-IDF Vectorizer • Cosine Similarity • unpdf Parser  

---

## 📁 Directory Structure
```
AI-Engine/
├── nlp/
│   ├── analyze-service.ts     # Orchestrator combining PDF parser, TF-IDF & skills
│   ├── pdf-parser.ts          # Server-side multi-page extraction via unpdf
│   ├── resume-matcher.ts      # Hybrid matching algorithm & evidence extractor
│   ├── skill-dictionary.ts    # 85+ Canonical skills with alias mapping
│   ├── text-preprocessing.ts  # Tokenization, lowercasing, stop-word removal
│   └── tfidf.ts               # Term Frequency - Inverse Document Frequency engine
└── diagrams/
    ├── flowchart_ai_matching.png              # AI Matching Algorithm Flowchart
    └── flowchart_resume_upload_extraction.png # Resume Parsing Flowchart
```

## 🧠 Core Mathematical Formula & Methodology
```
Match Score = (0.50 × Cosine_Similarity(TFIDF_Resume, TFIDF_Job)) 
            + (0.50 × (Matched_Canonical_Skills / Required_Job_Skills))
```

### Why Selected:
- **100% Explainable:** Rejects black-box decisioning by outputting exact sentence-level evidence quotes from the PDF.
- **Ultra-Fast Execution:** Local execution executes in **~82 milliseconds** per candidate.
- **Zero API Costs:** Pure deterministic TypeScript engine with no recurring OpenAI/Anthropic cloud billing.
