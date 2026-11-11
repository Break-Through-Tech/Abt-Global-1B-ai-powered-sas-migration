# AI-Powered SAS Migration

---

### 👥 **Team Members**

| Name             | GitHub Handle | Contribution                                                             |
|------------------|---------------|--------------------------------------------------------------------------|
| Christa Kulanda  | [@cmkulanda ](https://github.com/cmkulanda)   | Star Macro: translated and tested Program 0 helper functions |
| Diane Chege      | [@dianecheg ](https://github.com/dianecheg)  | Prompt Engineer: wrote AI guidelines and built the prompt library |
| Grace Petrov     | [@gpetrov2024](https://github.com/gpetrov2024)| Program 1: translating and validating |
| Sahed Saad       | [@sahed-saad](https://github.com/sahed-saad)   | Program 2: built the loader, summary score, and tests |
| Maria Larson     | [@Mlars290](https://github.com/Mlars290)   | Documentation Lead: set up uv and the PR review process; managed the project board |
| Fiona Herzog     | [@fiherzog ](https://github.com/fiherzog)    | Program 0: translated and validated against SAS output |
| Francis Adom     | [@IngFrancis](https://github.com/IngFrancis) | K-means helper functions (role TBD) |

---

## 🎯 **Project Highlights**

- Building an LLM-based system to translate legacy SAS data pipelines into Python for Abt Global.
- Targeting an end-to-end migration of a real-world SAS pipeline used to generate CMS's Overall Hospital Quality Star Ratings.
- Validating translated Python outputs against original SAS outputs using row-count, column-level, and statistic comparisons.
- Auto-generating documentation of the underlying data processing logic to preserve institutional knowledge during modernization.

---

## 👩🏽‍💻 **Setup and Installation**

We use uv to manage our Python environment. Dependencies are listed in `pyproject.toml`, and `uv.lock` pins the exact versions. We are not using Docker.

* Clone the repository: `git clone https://github.com/Break-Through-Tech/Abt-Global-1B-ai-powered-sas-migration.git`
* Install dependencies: `uv sync`
* Add a new library: `uv add <library>`
* Before pushing code, read [CONTRIBUTING.md](CONTRIBUTING.md). Team decisions are logged in [DECISIONS.md](DECISIONS.md).

---

## 🏗️ **Project Overview**

This project is part of Break Through Tech's Fall 2026 AI Studio program, in partnership with our host company, **Abt Global**, a research, technical assistance, and evaluation organization working in public health, education, and international development.

Our challenge is to explore how agentic AI and large language models can help modernize legacy analytics workflows. Many organizations, including public agencies like the Centers for Medicare & Medicaid Services (CMS), still rely on costly SAS systems. Migrating these to Python is typically a very manual and slow process that involves: code translation, testing, validation, and documentation.

Our goal is to build an LLM-based agentic system that automates as much of this migration as possible, translating SAS code into Python, validating that outputs match, flagging discrepancies, and generating documentation of the underlying data logic. We'll evaluate our system against a real SAS pipeline used to calculate CMS's Overall Hospital Quality Star Ratings. A successful outcome reduces manual migration effort while preserving accuracy and business knowledge for organizations moving off SAS.

---

## 📊 **Data Exploration**

* **Dataset:** SAS programs, datasets, and logs from the [CMS Overall Hospital Quality Star Rating SAS package](https://qualitynet.cms.gov/inpatient/public-reporting/overall-ratings/software), under 1GB total
* **Format:** Legacy SAS programs and datasets, provided in both `.sas7bdat` and `.csv` formats, plus a SAS log file and HTML procedure output
* **Contents:** Four SAS programs, one input dataset, and ten output datasets covering measure averages, national averages, and outcome/process/patient-experience scores
* **What we did:** Reviewed the SAS code structure and macro logic, and explored the input and output datasets with pandas.

---

## 🧠 **Model Development**

We translate the SAS programs into Python with help from large language models, then check every result against the SAS output. Each pull request notes the model and prompt used, and our AI guidelines are in the `ai/` folder. Results are validated with `pytest` and `datacompy`.

---

## 📈 **Results & Key Findings**

* Program 0 is translated, merged, and validated against the SAS output.
* The Program 2 loader, test folders, and summary score calculation are merged.
* Program 1 and the remaining Program 2 helper functions are in progress.

---

## 🚀 **Next Steps**
| Month | Milestone | Key Activities |
|---|---|---|
| **September** | Data Exploration & Setup | Explore SAS code structures, parse sample datasets, set up development environments. |
| **October** | Core System Development | Build translation modules, execution pipelines, and validation logic. |
| **November** | End-to-End Pipeline Migration | Finalize and test Programs 0 to 2 with validation, finish helper functions, finalize AI guidelines and docs, and prepare the final presentation. |

---

## 📝 **License**

This project is licensed under the MIT License.

---

## 📄 **References**

* [CMS Overall Hospital Quality Star Rating Software Package](https://qualitynet.cms.gov/inpatient/public-reporting/overall-ratings/software)
* [GitHub Projects Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects)

---

## 🙏 **Acknowledgements**

Thank you to our Challenge Advisor, **Anita Nti**, and our AI Studio Coach, **Nagalakshmi Pulivarthi**, for their guidance and support on this project.
