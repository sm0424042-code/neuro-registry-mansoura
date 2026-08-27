# Clinical selector source notes

These notes support the controlled, cohort-specific option catalogue in the protected research registry. They are reference material for form design, not patient-care instructions or clinical decision support.

| Cohort area | Design finding | Source |
|---|---|---|
| Stroke type | Keep the core event-type selector limited to ischaemic stroke, haemorrhagic stroke, and transient ischaemic attack. Aetiology and vascular-territory details belong in separate fields. | [American Stroke Association: Types of Stroke and Treatment](https://www.stroke.org/en/about-stroke/types-of-stroke) |
| Multiple sclerosis | Keep MS disease-course options separated from DMT and activity/monitoring options. Course classification should include relapsing-remitting, primary progressive, secondary progressive, and clinically isolated syndrome. | [National MS Society: Types of MS](https://www.nationalmssociety.org/understanding-ms/what-is-ms/types-of-ms) |
| CIDP | Separate CIDP variant from diagnostic certainty; the EAN/PNS revision uses the two categories **CIDP** and **possible CIDP**. Keep phenotype, electrodiagnostic evidence, and treatment response in distinct fields. | [EAN/PNS CIDP guideline (PubMed)](https://pubmed.ncbi.nlm.nih.gov/34327760/) |
| Neuro-ophthalmology | Distinguish optic neuritis and acute myelitis from other NMOSD core clinical characteristics. Retain AQP4/MOG laboratory status and neuro-ophthalmic examination in their own controlled fields. | [NMOSD clinical characteristics (NCBI Bookshelf)](https://www.ncbi.nlm.nih.gov/books/NBK572108/) |

The remaining expansions should use recognised cohort classifications and controlled terms. New choices must remain specific to the selected clinical field, must not introduce patient identifiers, and must stay excluded from de-identified exports where the field is an operational or narrative detail.

## Controlled expansion design

| Cohort | Additional controlled values to consider | Kept separate from |
|---|---|---|
| Stroke | Lacunar or multi-territory pattern; selected clinically relevant complications | Event type remains limited to ischaemic, haemorrhagic, and TIA. |
| MS | Relapse activity and evaluation/monitoring context; recognised therapy options | Disease course, DMT, safety screening, and disability remain separate fields. |
| Abnormal movements | Parkinsonism, myoclonus, ballism, stereotypy, functional movement disorder; more specific distribution and response terms | Phenotype, distribution, severity, functional effect, and treatment response remain distinct. |
| GBS | Pharyngeal-cervical-brachial, paraparetic, pure motor, sensory-predominant, and Bickerstaff variants; autonomic or Brighton evaluation context | GBS disability score and ventilatory support remain independent fields. |
| MG | MGFA subclass, antibody, thymoma, crisis, and outcome/evaluation detail | Classification, antibody state, thymoma state, crisis state, and evaluation remain separate fields. |
| Myelopathy | Conus/transition levels, demyelinating, neoplastic, metabolic/nutritional, and vascular-malformation causes; bladder presentation and evaluation context | Level, cause, UMN/LMN findings, bladder involvement, and evaluation remain distinct. |
| Neuro-ophthalmology | Optic neuropathy, ischaemic optic neuropathy, ocular-motor palsy, chiasmal/cortical syndrome; disease and examination pathways | Visual syndrome, laterality, acuity, RAPD, disease classification, antibody profile, and systemic linkage remain separate. |
| CIDP | Diagnostic certainty, conduction-block/electrodiagnostic pattern, CSF degree, and disability/response-review context | Variant, diagnostic pathway, EMG/NCS evidence, CSF protein, and evaluation remain distinct. |
