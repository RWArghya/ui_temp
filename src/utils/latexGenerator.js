/**
 * Utility to generate a professional .tex LaTeX file matching the
 * exact Overleaf template structure from references/ipuf/resume_template.tex
 */

export function escapeLatex(str = '') {
  if (typeof str !== 'string') return ''
  return str
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
}

export function generateLatexResume(config, profile) {
  const {
    sections = [],
    sectionOrder = ['skills', 'projects', 'education', 'certifications', 'achievements'],
    includedSections = {},
    customItems = {},
  } = config

  const name = profile?.name || 'Aarav Sharma'
  const email = profile?.email || ''
  const phone = profile?.phone || ''
  const location = profile?.region || profile?.location || ''

  // Connected profile links (GitHub, LinkedIn, Portfolio, etc.)
  const connectedProfiles = customItems.links || profile?.connectedProfiles || []
  const githubItem = connectedProfiles.find(p => p.platform?.toLowerCase().includes('github'))
  const linkedinItem = connectedProfiles.find(p => p.platform?.toLowerCase().includes('linkedin'))
  const portfolioItem = connectedProfiles.find(p =>
    p.platform?.toLowerCase().includes('portfolio') ||
    p.platform?.toLowerCase().includes('website') ||
    p.platform?.toLowerCase().includes('vercel')
  )

  // Build header contacts without icons (pure text hyperlinks)
  const headerLinks = []
  if (phone) {
    headerLinks.push(`\\href{tel:${escapeLatex(phone.replace(/[^0-9+]/g, ''))}}{\\underline{${escapeLatex(phone)}}}`)
  }
  if (email) {
    headerLinks.push(`\\href{mailto:${escapeLatex(email)}}{\\underline{${escapeLatex(email)}}}`)
  }
  if (location) {
    headerLinks.push(`\\underline{${escapeLatex(location)}}`)
  }
  if (linkedinItem) {
    const rawUrl = linkedinItem.url.startsWith('http') ? linkedinItem.url : `https://${linkedinItem.url}`
    headerLinks.push(`\\href{${escapeLatex(rawUrl)}}{\\underline{LinkedIn}}`)
  }
  if (githubItem) {
    const rawUrl = githubItem.url.startsWith('http') ? githubItem.url : `https://${githubItem.url}`
    headerLinks.push(`\\href{${escapeLatex(rawUrl)}}{\\underline{GitHub}}`)
  }
  if (portfolioItem) {
    const rawUrl = portfolioItem.url.startsWith('http') ? portfolioItem.url : `https://${portfolioItem.url}`
    headerLinks.push(`\\href{${escapeLatex(rawUrl)}}{\\underline{Portfolio}}`)
  }

  // Fallback for other connected profiles not covered above
  connectedProfiles.forEach(p => {
    if (p !== githubItem && p !== linkedinItem && p !== portfolioItem && p.shared !== false) {
      const rawUrl = p.url.startsWith('http') ? p.url : `https://${p.url}`
      headerLinks.push(`\\href{${escapeLatex(rawUrl)}}{\\underline{${escapeLatex(p.platform)}}}`)
    }
  })

  // Format header line
  const headerStr = headerLinks.join('\\hspace{0.8em}\n    ')

  // Generate Sections
  const sectionLatexBlocks = []

  sectionOrder.forEach(secKey => {
    if (!includedSections[secKey]) return

    if (secKey === 'skills') {
      const skills = customItems.skills || profile?.skills || []
      const domains = profile?.domains || []
      const interests = profile?.interests || []

      if (skills.length > 0 || domains.length > 0) {
        sectionLatexBlocks.push(`%-----------SKILLS-----------
\\section{Technical Skills}
\\resumeSubHeadingListStart
\\vspace{-6pt}
\\resumeItemListStart
\\resumeItem{\\textbf{Core Technologies \\& Languages:} ${escapeLatex(skills.join(', '))}}
${domains.length > 0 ? `\\resumeItem{\\textbf{Specialized Domains:} ${escapeLatex(domains.join(', '))}}` : ''}
${interests.length > 0 ? `\\resumeItem{\\textbf{Areas of Focus:} ${escapeLatex(interests.join(', '))}}` : ''}
\\resumeItemListEnd
\\resumeSubHeadingListEnd
\\vspace{2pt}`)
      }
    }

    if (secKey === 'projects') {
      const projects = (customItems.projects || profile?.projects || []).filter(p => p._included !== false)
      if (projects.length > 0) {
        const projectItems = projects.map(proj => {
          const links = []
          if (proj.sourceCodeUrl) {
            links.push(`\\href{${escapeLatex(proj.sourceCodeUrl)}}{\\textcolor{linkcolor}{GitHub Repository}}`)
          } else if (proj.link) {
            links.push(`\\href{${escapeLatex(proj.link.startsWith('http') ? proj.link : `https://${proj.link}`)}}{\\textcolor{linkcolor}{Repository}}`)
          }
          if (proj.demoUrl) {
            links.push(`\\href{${escapeLatex(proj.demoUrl)}}{\\textcolor{linkcolor}{Live Demo}}`)
          }
          if (proj.docsUrl) {
            links.push(`\\href{${escapeLatex(proj.docsUrl)}}{\\textcolor{linkcolor}{Documentation}}`)
          }

          const headingLeft = `${escapeLatex(proj.title)}${links.length > 0 ? ` $|$ ${links.join(' $|$ ')}` : ''}`
          const techStackStr = Array.isArray(proj.techStack)
            ? proj.techStack.join(', ')
            : (proj.techStack || '')

          // Break down description by newlines or sentences into bullet items
          const rawDesc = proj.description || ''
          const descBullets = rawDesc
            .split(/\r?\n/)
            .map(s => s.trim())
            .filter(Boolean)

          const itemsStr = descBullets.length > 0
            ? descBullets.map(b => `\\resumeItem{${escapeLatex(b)}}`).join('\n')
            : (rawDesc ? `\\resumeItem{${escapeLatex(rawDesc)}}` : '')

          return `\\resumeProjectHeading
{${headingLeft}}{}
${techStackStr ? `{\\small \\textit{${escapeLatex(techStackStr)}}}\\vspace{-4pt}` : ''}
\\resumeItemListStart
${itemsStr || '\\resumeItem{Project implementation and features.}'}
\\resumeItemListEnd`
        }).join('\n')

        sectionLatexBlocks.push(`%-----------PROJECTS-----------
\\section{Technical Projects}
\\resumeSubHeadingListStart
\\vspace{-4pt}
${projectItems}
\\resumeSubHeadingListEnd
\\vspace{2pt}`)
      }
    }

    if (secKey === 'education') {
      const educations = (customItems.education || profile?.education || []).filter(e => e._included !== false)
      if (educations.length > 0) {
        const eduItems = educations.map(edu => {
          const inst = edu.institution || edu.org || 'Institution'
          const timeRange = edu.isOngoing
            ? `${edu.startYear || ''} – Present`
            : (edu.startYear && edu.endYear ? `${edu.startYear} – ${edu.endYear}` : (edu.endYear || edu.startYear || ''))
          
          const degreePart = [edu.degree, edu.specialization].filter(Boolean).join(' in ') || edu.title || 'Degree'
          const locPart = [edu.boardOrUniversity, edu.location].filter(Boolean).join(', ')

          return `\\resumeSubheading
{${escapeLatex(inst)}}{${escapeLatex(timeRange)}}
{${escapeLatex(degreePart)}}{${escapeLatex(locPart)}}`
        }).join('\n')

        sectionLatexBlocks.push(`%-----------EDUCATION-----------
\\section{Education}
\\resumeSubHeadingListStart
\\vspace{-4pt}
${eduItems}
\\resumeSubHeadingListEnd
\\vspace{2pt}`)
      }
    }

    if (secKey === 'certifications') {
      const certs = (customItems.certifications || [
        ...(profile?.selfCerts || []),
        ...(profile?.verifiedCerts || []),
      ]).filter(c => c._included !== false)

      if (certs.length > 0) {
        const certItems = certs.map(c => {
          const org = c.org || c.issuer || 'Issuing Organization'
          const date = c.date || c.issuedOn || ''
          const title = c.title || c.name || 'Certificate'
          const links = []
          if (c.link) {
            links.push(`\\href{${escapeLatex(c.link.startsWith('http') ? c.link : `https://${c.link}`)}}{\\textcolor{linkcolor}{Credential Link}}`)
          }
          if (c.verifiableId) {
            links.push(`ID: ${escapeLatex(c.verifiableId)}`)
          }

          return `\\resumeSubheading
{${escapeLatex(title)}}{${escapeLatex(date)}}
{\\small ${escapeLatex(org)}${links.length > 0 ? ` $|$ ${links.join(' $|$ ')}` : ''}}{}`
        }).join('\n')

        sectionLatexBlocks.push(`%-----------CERTIFICATIONS-----------
\\section{Certifications}
\\resumeSubHeadingListStart
\\vspace{-4pt}
${certItems}
\\resumeSubHeadingListEnd
\\vspace{2pt}`)
      }
    }

    if (secKey === 'achievements') {
      const achievements = (customItems.achievements || profile?.achievements || []).filter(a => a._included !== false)
      if (achievements.length > 0) {
        const achItems = achievements.map(ach => {
          return `\\resumeItem{\\textbf{${escapeLatex(ach.title)}}: ${escapeLatex(ach.description || '')}}`
        }).join('\n')

        sectionLatexBlocks.push(`%-----------ACHIEVEMENTS-----------
\\section{Honors \\& Achievements}
\\resumeSubHeadingListStart
\\vspace{-6pt}
\\resumeItemListStart
${achItems}
\\resumeItemListEnd
\\resumeSubHeadingListEnd
\\vspace{2pt}`)
      }
    }
  })

  return `%------------------------- % Resume in Latex %------------------------
\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{graphicx}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{xcolor}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[colorlinks=true, urlcolor=linkcolor]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\usepackage{multicol}
\\setlength{\multicolsep}{-3.0pt}
\\setlength{\columnsep}{-1pt}
\\input{glyphtounicode}

%----------COLOR DEFINITIONS----------
\\definecolor{headingcolor}{RGB}{40, 70, 150}
\\definecolor{linkcolor}{RGB}{0, 122, 204}
\\definecolor{sectionrulecolor}{RGB}{200, 200, 200}
\\definecolor{accent}{RGB}{220, 60, 60}

\\pagestyle{fancy}
\\fancyhf{} % clear all header and footer fields
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.6in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.19in}
\\addtolength{\\topmargin}{-.7in}
\\addtolength{\\textheight}{1.4in}
\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\color{headingcolor}\\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries
}{}{0em}{}[\\color{sectionrulecolor}\\titlerule \\vspace{-5pt}]
\\pdfgentounicode=1

%------------------------- % Custom commands
\\newcommand{\\resumeItem}[1]{\\item\\small{{#1 \\vspace{-2pt}}}}
\\newcommand{\\resumeSubheading}[4]{\\vspace{-1pt}\\item
\\begin{tabular*}{1.0\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
\\small\\textbf{\\textcolor{headingcolor}{#1}} & \\textbf{\\small \\textcolor{headingcolor}{#2}} \\\\
\\textit{\\small#3} & \\textit{\\small #4} \\\\
\\end{tabular*}\\vspace{-4pt}}
\\newcommand{\\resumeProjectHeading}[2]{\\vspace{-4pt}\\item
\\begin{tabular*}{1.001\\textwidth}{l@{\\extracolsep{\\fill}}r}
\\small\\textcolor{headingcolor}{\\textbf{#1}} & \\textbf{\\small \\textcolor{headingcolor}{#2}}\\\\
\\end{tabular*}\\vspace{-2pt}}
\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}
\\renewcommand\\labelitemi{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.0in, label={}, itemsep=0pt]} 
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-12pt}}

%------------------------------------------- %%%%%% RESUME STARTS HERE %%%%%%%%%%%%%%%%%%%%%%%%%%%%
\\begin{document}

%-----------PERSONAL DETAILS-----------
\\vspace{-10pt}
\\noindent
\\begin{tabular*}{\\textwidth}{@{}l@{\\extracolsep{\\fill}}r@{}}
\\begin{minipage}[c]{\\textwidth}
    \\vspace{0pt}
    {\\Huge \\textcolor{headingcolor}{\\scshape ${escapeLatex(name)}}} \\\\[3pt]
    \\footnotesize
    ${headerStr}
\\end{minipage}
\\end{tabular*}
\\vspace{2pt}

${sectionLatexBlocks.join('\n\n')}

\\end{document}
`
}

export function downloadLatexFile(filename, content) {
  const blob = new Blob([content], { type: 'text/x-tex;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.tex') ? filename : `${filename}.tex`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
