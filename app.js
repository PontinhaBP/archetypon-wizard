 (function(){

  const form = document.getElementById('wizardForm');

  const runBtn = document.getElementById('runBtn');

  const pdfBtn = document.getElementById('pdfBtn');

  const output = document.getElementById('output');

  const summaryDiv = document.getElementById('summary');

  const foundationDiv = document.getElementById('foundation');

  const npoDiv = document.getElementById('npo');

  const notesDiv = document.getElementById('notes');

  const linksDiv = document.getElementById('links');

 

  function getValues(){

    const data = {};

    for(const el of form.querySelectorAll('select')) data[el.name] = el.value;

    return data;

  }

 

  function riskFactor(mult){

    if(mult==='High') return 2.0;

    if(mult==='Medium') return 1.5;

    return 1.0;

  }

 

  function compute(data){

    let federalScore = 0, provincialScore = 0;

    const publicFundingYes = ['10kTo249k','250kTo499k','500kPlus'].includes(data.publicFunds);

 

    // Funding implies public-facing ops

    if(['Grants','Donations','Events'].includes(data.funding)) federalScore += 2; else provincialScore += 1;

 

    // Charitable intent + receipts plan

    if(data.charitable==='Yes' && data.receipts!=='No') federalScore += 3; else provincialScore += 1;

 

    // Budget band (granular)

    if(data.budget==='500kPlus') federalScore += 3;

    else if(data.budget==='250kTo500k') federalScore += 2;

    else if(data.budget==='100kTo250k') federalScore += 1;

    else provincialScore += 1; // under 100k leans provincial simplicity

 

    // Beneficiaries

    if(data.beneficiaries==='Communities') federalScore += 1;

    else if(data.beneficiaries==='Members') provincialScore += 1;

 

    // Compliance capacity

    if(data.capacity==='High') federalScore += 1;

    else if(data.capacity==='Low') provincialScore += 1;

 

    // Risk multiplier

    const mult = riskFactor(data.riskMult);

    federalScore = Math.round(federalScore * mult);

 

    const foundationLevel = (federalScore >= provincialScore) ? 'Federal (CNCA)' : 'Provincial (Québec Part III)';

 

    // CNCA soliciting classification

    let soliciting;

    if(data.publicFunds==='Under10k') soliciting = 'Non-soliciting (< $10k public funds)';

    else if(publicFundingYes) soliciting = 'Soliciting corporation (≥ $10k public funds)';

    else soliciting = 'Assess after first fiscal year';

 

    // Charity status

    let charityRec;

    if(data.charitable==='Yes' && data.receipts!=='No' && data.partisan==='No'){

      charityRec = 'Apply for CRA registered charity within 12–24 months';

    } else if(data.charitable==='Partly'){

      charityRec = 'Operate as NPO now; refine objects, then consider CRA charity';

    } else {

      charityRec = 'Operate as NPO without charity status';

    }

 

    const npoLevel = 'Provincial (Québec Part III) for operations';

 

    return { foundationLevel, soliciting, charityRec, npoLevel, federalScore, provincialScore, mult };

  }

 

  function render(data, res){

    output.hidden = false;

 

    summaryDiv.innerHTML = `<h3>Summary</h3>

      <p><strong>Budget band:</strong> ${data.budget} |

         <strong>Main funding:</strong> ${data.funding} |

         <strong>Public funding:</strong> ${data.publicFunds} |

         <strong>Risk multiplier:</strong> ×${res.mult}</p>`;

 

    foundationDiv.innerHTML = `<h3>Foundation (Landlord)</h3>

      <p><strong>Incorporation level:</strong> ${res.foundationLevel}

      (score F:${res.federalScore} / P:${res.provincialScore})</p>

      <p><strong>CNCA classification:</strong> ${res.soliciting}</p>

      <p><strong>Charity status:</strong> ${res.charityRec}</p>`;

 

    npoDiv.innerHTML = `<h3>NPO (Tenant)</h3>

      <p><strong>Incorporation level:</strong> ${res.npoLevel}</p>`;

 

    notesDiv.innerHTML = `<h3>Notes & Next Steps</h3>

      <ul>

        <li>Activate D&O insurance before operations.</li>

        <li>Open separate bank accounts for Foundation and NPO.</li>

        <li>Deploy Digital HQ (Microsoft 365) for governance records.</li>

        <li>Ensure advocacy is non‑partisan and tied to charitable purposes.</li>

      </ul>`;

 

    linksDiv.innerHTML = `<h3>Official Filing Guides</h3>

      <ul>

        <li><a href="https://ised-isde.canada.ca/site/corporations-canada/en/not-profit-corporations" target="_blank" rel="noopener">Corporations Canada – Not-for-profit corporations (CNCA)</a></li>

        <li><a href="https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/emploi-solidarite-sociale/registraire_entreprises/RE-303-G_REQ_Guide_CONST_PMSBL.pdf" target="_blank" rel="noopener">Québec – Guide RE‑303 (Part III, LCQ)</a></li>

      </ul>`;

 

    pdfBtn.disabled = false;

  }

 

  function generatePDF(){

    const { jsPDF } = window.jspdf || {};

    if(!jsPDF){

      window.print();

      return;

    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const margin = 40; let y = margin;

    const data = getValues();

    const res = compute(data);

 

    doc.setFont('helvetica','bold'); doc.setFontSize(16);

    doc.text('Archetypon Legal Structure Wizard – Recommendation', margin, y); y += 24;

 

    doc.setFont('helvetica','normal'); doc.setFontSize(11);

    doc.text(`Budget band: ${data.budget}`, margin, y); y += 16;

    doc.text(`Funding: ${data.funding}`, margin, y); y += 16;

    doc.text(`Public funding: ${data.publicFunds}`, margin, y); y += 16;

    doc.text(`Risk multiplier: ×${res.mult}`, margin, y); y += 24;

 

    doc.setFont('helvetica','bold'); doc.text('Foundation (Landlord)', margin, y); y += 18;

    doc.setFont('helvetica','normal');

    doc.text(`Incorporation level: ${res.foundationLevel} (score F:${res.federalScore} / P:${res.provincialScore})`, margin, y); y += 16;

    doc.text(`CNCA classification: ${res.soliciting}`, margin, y); y += 16;

    doc.text(`Charity status: ${res.charityRec}`, margin, y); y += 24;

 

    doc.setFont('helvetica','bold'); doc.text('NPO (Tenant)', margin, y); y += 18;

    doc.setFont('helvetica','normal'); doc.text(`Incorporation level: ${res.npoLevel}`, margin, y); y += 24;

 

    doc.setFont('helvetica','bold'); doc.text('Links', margin, y); y += 18;

    doc.setFont('helvetica','normal');

    doc.text('Corporations Canada – CNCA: https://ised-isde.canada.ca/site/corporations-canada/en/not-profit-corporations', margin, y); y += 14;

    doc.text('Québec – Guide RE‑303: https://cdn-contenu.quebec.ca/.../RE-303-G_REQ_Guide_CONST_PMSBL.pdf', margin, y); y += 24;

 

    doc.save('Archetypon_Recommendation.pdf');

  }

 

  runBtn.addEventListener('click', ()=>{

    const data = getValues();

    const res = compute(data);

    render(data,res);

  });

  pdfBtn.addEventListener('click', generatePDF);

})();
