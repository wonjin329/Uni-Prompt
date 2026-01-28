document.addEventListener('DOMContentLoaded', () => {
  // --- 1. STATE MANAGEMENT ---
  const promptState = {
    assignmentType: { value: '', custom: '' },
    authorLevel: { value: '', custom: '' },
    tone: { value: '', custom: '' },
    majorField: { value: '', custom: '' },
    emphasis: { selected: new Set(), custom: '' },
    topic: '',
    keywords: '',
    references: ''
  };

  // --- 2. DOM ELEMENTS ---
  const steps = document.querySelectorAll('.step');
  const stepMarkers = document.querySelectorAll('.step-marker');
  const nextTo2Btn = document.getElementById('next-to-2');
  const nextTo3Btn = document.getElementById('next-to-3');
  const backTo1Btn = document.getElementById('back-to-1');
  const backTo2Btn = document.getElementById('back-to-2');
  const generatedPromptEl = document.getElementById('generatedPrompt');
  const copyButton = document.getElementById('copyButton');
  const outputSection = document.querySelector('.output-section');
  const formInputs = document.querySelectorAll('#topic, #keywords, #references');
  const hybridOptionGroups = document.querySelectorAll('.hybrid-options');
  const customInputs = document.querySelectorAll('.custom-input');
  const emphasisGroup = document.querySelector('[data-group="emphasis"]');

  // --- 3. PROMPT COMPOSER ENGINE ---

  const getResolvedValue = (state, key, map) => {
    const stateItem = state[key];
    if (stateItem.value === 'custom') return stateItem.custom;
    return map[stateItem.value] || stateItem.value || '';
  };
  
  const dataMaps = {
    authorLevel: { 'high-school': '고등학생', 'undergrad-freshman': '1-2학년 학부생', 'undergrad-senior': '3-4학년 학부생', 'master': '석사 과정생', 'doctor': '박사 과정생' },
    tone: { 'academic': '학술적 스타일', 'explanatory': '설명적 스타일', 'critical': '비평적 스타일', 'persuasive': '설득적 스타일', 'creative': '창의적 스타일' },
    assignmentType: { 'report': '리포트', 'ppt': 'PPT 개요', 'summary': '논문 요약/분석', 'problem-solving': '연습문제 풀이', 'brainstorming': '브레인스토밍', 'proofreading': '글 교정', 'lab-report': '실험 보고서', 'cover-letter': '자기소개서' },
    emphasis: { 
      'case-study': '사례 위주로 작성', 
      'personal-thoughts': '개인적인 생각/느낀점 포함', 
      'citation-apa': '출처 표기 필수 (APA 형식)', 
      'word-count': '분량 엄수', 
      'quantitative': '정량적 데이터 포함', 
      'compare-contrast': '두 가지 관점 비교/대조',
      'latest-research': '최신 연구 동향 반영', 
      'theoretical-background': '이론적 배경 강화', 
      'data-statistics': '구체적인 데이터 및 통계 활용'
    }
  };
  
  const promptBlocks = {
    header: () => `# [Uni-Prompt] AI 작업 지시서`,
    persona: (state) => {
      const authorLevel = getResolvedValue(state, 'authorLevel', dataMaps.authorLevel);
      const majorField = getResolvedValue(state, 'majorField', {});
      const tone = getResolvedValue(state, 'tone', dataMaps.tone);
      const personaIntro = `너는 '${majorField || '다양한 분야'}' 전공 지식을 갖춘 전문 AI 어시스턴트야. '${authorLevel || '학생'}'의 과제를 돕는 것이 너의 임무야.`;
      const toneInstruction = `모든 답변은 '${tone || '기본'}' 스타일을 일관되게 유지해야 해.`;
      return `## 1. AI 페르소나 (AI Persona)\n- ${personaIntro}\n- ${toneInstruction}`;
    },
    taskDefinition: (state) => {
      const assignmentType = getResolvedValue(state, 'assignmentType', dataMaps.assignmentType);
      return `## 2. 핵심 과업 (Primary Task)\n- **과제 종류:** ${assignmentType || '[과제 유형 선택 필요]'}\n- **주제:** ${state.topic || '[주제 입력 필요]'}`;
    },
    chainOfThought: (state) => {
      if (['report', 'summary', 'ppt', 'lab-report'].includes(state.assignmentType.value)) {
        return `## 3. 작업 순서 (Chain of Thought)\n1. **정보 분석:** 내가 제공하는 모든 정보를 종합적으로 분석한다.\n2. **구조 설계:** 분석 내용을 바탕으로, 과제에 가장 적합한 구조를 설계한다.\n3. **초안 작성:** 설계한 구조에 따라 내용을 채워 초안을 작성한다.\n4. **자체 검토:** '자체 검토 체크리스트'에 따라 결과물을 검토하고 수정한다.`;
      }
      return '';
    },
    coreInstructions: (state) => {
      const emphasisItems = Array.from(state.emphasis.selected).map(val => dataMaps.emphasis[val] || val);
      if (state.emphasis.custom) emphasisItems.push(state.emphasis.custom);
      
      const emphasisText = emphasisItems.length > 0 ? `- **교수님 강조 사항:**\n${emphasisItems.map(item => `    - ${item}`).join('\n')}` : '';
      const keywordsText = state.keywords ? `- **핵심 키워드:** 다음 키워드를 중심으로 내용을 전개해줘: "${state.keywords}"` : '';
      const finalInstructions = [emphasisText, keywordsText].filter(Boolean).join('\n');
      return `## 4. 세부 지침 (Detailed Instructions)\n${finalInstructions}`;
    },
    sourceHandling: (state) => {
      if (state.references) {
        return `- **참고 문헌 활용:** 아래 문헌들의 핵심 논지를 종합하고, 서로 비교/대조하여 논리를 강화해줘. 단순 요약은 지양해줘.\n  - 참고 문헌 리스트:\n${state.references.split('\n').map(line => `    - ${line}`).join('\n')}`;
      }
      return '';
    },
    selfCorrection: (state) => {
      const authorLevel = getResolvedValue(state, 'authorLevel', dataMaps.authorLevel);
      const tone = getResolvedValue(state, 'tone', dataMaps.tone);
      return `## 5. 자체 검토 체크리스트 (Self-Correction Checklist)\n결과물을 제출하기 전, 아래 항목을 스스로 검토하고 부족한 부분을 수정한 후 최종 답변을 해줘.\n- **[ ] 요구사항 충족:** 내가 요청한 모든 지시사항(주제, 키워드, 강조사항)이 정확히 반영되었는가?\n- **[ ] 페르소나 유지:** 답변의 전체적인 수준이 '${authorLevel}'의 눈높이에 맞는가? '${tone}'이 일관되게 유지되었는가?\n- **[ ] 논리성 및 완결성:** 글의 구조가 체계적이고, 논리적 비약이나 미완성된 부분이 없는가?`;
    },
    metaInstructions: () => {
      return `## 6. 최종 출력 규칙 (Meta-Instructions)\n**가장 중요:** 너의 답변은 일회성으로 끝나서는 안 되며, 나와의 지속적인 상호작용을 위한 '워크스페이스'를 제공해야 한다. 다음 규칙을 반드시 준수해줘.\n1.  **[계획 브리핑]:** 가장 먼저, "알겠습니다. 요청하신 과제에 대해..."로 시작하며 작업 계획을 간략히 브리핑한다.\n2.  **[핵심 과업 수행]:** 그 후에, 위에서 정의된 핵심 과업을 수행한다.\n3.  **[다음 스텝 제안]:** 마지막으로, 생성된 결과물에 기반하여 내가 추가로 요청할 수 있는 작업들을 '**[추가 작업 제안]'** 이라는 제목으로 3~4가지 제안한다. 각 제안은 내가 바로 복사해서 입력할 수 있는 명령어 형식이어야 한다. (예: \`/expand [섹션]\`, \`/critique\`, \`/rephrase\`, \`/examples\`)`;
    }
  };

  const promptRecipes = {
    'default': ['header', 'persona', 'taskDefinition', 'chainOfThought', 'coreInstructions', 'sourceHandling', 'selfCorrection', 'metaInstructions'],
    'brainstorming': ['header', 'persona', 'taskDefinition', 'coreInstructions', 'metaInstructions'],
    'proofreading': ['header', 'persona', 'taskDefinition', 'coreInstructions', 'selfCorrection', 'metaInstructions'],
  };
  
  const generateFinalPrompt = () => {
    if (!promptState.assignmentType.value) {
      generatedPromptEl.textContent = 'Step 1에서 과제 유형을 선택해주세요.';
      return;
    }
    const recipe = promptRecipes[promptState.assignmentType.value] || promptRecipes['default'];
    // FIX: Pass promptState to each block function
    const prompt = recipe.map(blockName => promptBlocks[blockName]?.(promptState))
                         .filter(Boolean).join('\n\n');
    generatedPromptEl.textContent = prompt.replace(/(\n\s*){3,}/g, '\n\n').replace(/(\n- \n)/g, '\n');
  };

  // --- 4. EVENT LISTENERS ---

  hybridOptionGroups.forEach(group => {
    const groupName = group.dataset.group;
    const buttons = group.querySelectorAll('.option-btn');
    const select = group.querySelector('.choice-select-hybrid');

    group.addEventListener('click', (e) => {
      if (e.target.matches('.option-btn')) {
        promptState[groupName].value = e.target.dataset.value;
        buttons.forEach(btn => btn.classList.remove('selected'));
        e.target.classList.add('selected');
        if(select) select.value = "";
        const customInput = document.getElementById(`${groupName}Custom`);
        if(customInput) customInput.classList.remove('visible');
        promptState[groupName].custom = '';
        generateFinalPrompt();
      }
    });

    if (select) {
      select.addEventListener('change', () => {
        promptState[groupName].value = select.value;
        buttons.forEach(btn => btn.classList.remove('selected'));
        const customInput = document.getElementById(`${groupName}Custom`);
        const isCustom = select.value === 'custom';
        customInput.classList.toggle('visible', isCustom);
        if (isCustom) { customInput.focus(); }
        else { customInput.value = ''; promptState[groupName].custom = ''; }
        generateFinalPrompt();
      });
    }
  });

  document.querySelectorAll('.choice-select:not(.choice-select-hybrid)').forEach(select => {
    const groupName = select.id;
    select.addEventListener('change', () => {
        promptState[groupName].value = select.value;
        const customInput = document.getElementById(`${groupName}Custom`);
        const isCustom = select.value === 'custom';
        customInput.classList.toggle('visible', isCustom);
        if (isCustom) { customInput.focus(); }
        else { customInput.value = ''; promptState[groupName].custom = ''; }
        generateFinalPrompt();
    });
  });

  customInputs.forEach(input => {
    const groupName = input.id.replace('Custom', '');
    input.addEventListener('input', () => {
      promptState[groupName].custom = input.value;
      generateFinalPrompt();
    });
  });

  emphasisGroup.addEventListener('change', (e) => {
    if (e.target.matches('input[type="checkbox"]')) {
      if (e.target.value === 'custom') {
        const customInput = document.getElementById('emphasisCustom');
        customInput.classList.toggle('visible', e.target.checked);
        if (!e.target.checked) {
          customInput.value = '';
          promptState.emphasis.custom = '';
        }
      }
      if (e.target.checked) {
        promptState.emphasis.selected.add(e.target.value);
      } else {
        promptState.emphasis.selected.delete(e.target.value);
      }
    }
    generateFinalPrompt();
  });
  
  document.getElementById('emphasisCustom').addEventListener('input', (e) => {
    promptState.emphasis.custom = e.target.value;
    generateFinalPrompt();
  });
  
  formInputs.forEach(input => {
    input.addEventListener('input', () => {
      promptState[input.id] = input.value;
      generateFinalPrompt();
    });
  });
  
  const navigateTo = (stepNum) => {
    steps.forEach(step => step.classList.remove('active'));
    document.getElementById(`step-${stepNum}`).classList.add('active');
    
    stepMarkers.forEach(marker => {
      marker.classList.toggle('active', marker.dataset.step <= stepNum);
    });
  };

  nextTo2Btn.addEventListener('click', () => navigateTo(2));
  nextTo3Btn.addEventListener('click', () => navigateTo(3));
  backTo1Btn.addEventListener('click', () => navigateTo(1));
  backTo2Btn.addEventListener('click', () => navigateTo(2));

  copyButton.addEventListener('click', () => {
    const textToCopy = generatedPromptEl.textContent;
    if (!textToCopy || textToCopy.includes('필요')) {
      alert('프롬프트의 필수 항목을 모두 채워주세요.');
      return;
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
      copyButton.textContent = '복사 완료!';
      setTimeout(() => { copyButton.textContent = '프롬프트 복사'; }, 2000);
    });
  });

  // --- 5. INITIALIZATION ---
  navigateTo(1);
  generateFinalPrompt();
});