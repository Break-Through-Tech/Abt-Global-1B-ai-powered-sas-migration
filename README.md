# AI-Powered SAS Migration

---

### 👥 **Team Members**

| Name             | GitHub Handle | Contribution                                                             |
|------------------|---------------|--------------------------------------------------------------------------|
| Christa Kulanda  | @cmkulanda |  |
| Diane Chege      | @TBD          |  |
| Grace Petrov     | @TBD          |  |
| Sahed Saad       | @sahed-saad |  |
| Maria Larson     | @Mlars290          |  |
| Fiona Herzog     | @TBD          |  |
| Francis Adom     | @TBD          |  |

---

## 🎯 **Project Highlights**

- Building an LLM-based system to translate legacy SAS data pipelines into Python for Abt Global.
- Targeting an end-to-end migration of a real-world SAS pipeline used to generate CMS's Overall Hospital Quality Star Ratings.
- Validating translated Python outputs against original SAS outputs using row-count, column-level, and statistic comparisons.
- Auto-generating documentation of the underlying data processing logic to preserve institutional knowledge during modernization.

---

## 👩🏽‍💻 **Setup and Installation**

*We're just getting started this month (September), this section will be filled in as our environment comes together. For now:*

* Clone the repository: `git clone https://github.com/Break-Through-Tech/Abt-Global-1B-ai-powered-sas-migration.git`
* Install dependencies once `requirements.txt` is populated: `pip install -r requirements.txt`
* Set up a Python environment

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
* **This month's focus:** Reviewing SAS code structure and macro logic, exploring the input/output datasets, and setting up our Python environment for reading SAS files

---

## 🧠 **Model Development**

*Development hasn't started yet, this is our September to October milestone.* 

---

## 📈 **Results & Key Findings**

*No results yet, our team is in the setup and data exploration phase for September. We'll document validation metrics and execution results here once our translation module is built and tested.*

---

## 🚀 **Next Steps**
| Month | Milestone | Key Activities |
|---|---|---|
| **September** | Data Exploration & Setup | Explore SAS code structures, parse sample datasets, set up development environments. |
| **October** | Core System Development | Build translation modules, execution pipelines, and validation logic. |
| **November** | End-to-End Pipeline Migration | Apply system to the 4-program CMS pipeline, execute end-to-end translation, validate, document, and prepare final demo. |

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
