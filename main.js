document.addEventListener('DOMContentLoaded', () => {
  // --- 1. STATE MANAGEMENT ---
  const promptState = {
    assignmentType: { value: '', custom: '' },
    authorLevel: { value: '', custom: '' },
    tone: { value: '', custom: '' },
    majorField: { value: '', custom: '' },
    topic: '',
    keywords: '',
    emphasis: '',
    references: ''
  };

  // --- 2. DOM ELEMENTS ---
  const steps = document.querySelectorAll('.step');
  const stepMarkers = document.querySelectorAll('.step-marker');
  const navButtons = document.querySelectorAll('.nav-btn');
  const generatedPromptEl = document.getElementById('generatedPrompt');
  const copyButton = document.getElementById('copyButton');
  const formInputs = document.querySelectorAll('#topic, #keywords, #emphasis, #references');
  const hybridOptionGroups = document.querySelectorAll('.hybrid-options');
  const customInputs = document.querySelectorAll('.custom-input');

  // --- 3. PROMPT COMPOSER ENGINE ---

  const getResolvedValue = (key) => {
    const state = promptState[key];
    if (state.value === 'custom') return state.custom;
    
    const dataMap = {
      authorLevel: { 'high-school': '고등학생', 'undergrad-freshman': '1-2학년 학부생', 'undergrad-senior': '3-4학년 학부생', 'master': '석사 과정생', 'doctor': '박사 과정생' },
      tone: { 'academic': '학술적 스타일', 'explanatory': '설명적 스타일', 'critical': '비평적 스타일', 'persuasive': '설득적 스타일', 'creative': '창의적 스타일' },
      assignmentType: { 'report': '리포트', 'ppt': 'PPT 개요', 'summary': '논문 요약/분석', 'problem-solving': '연습문제 풀이', 'brainstorming': '브레인스토밍', 'proofreading': '글 교정', 'lab-report': '실험 보고서', 'cover-letter': '자기소개서' },
    };

    return dataMap[key]?.[state.value] || state.value;
  };
  
  const promptBlocks = {
    header: () => `# [Uni-Prompt] AI 작업 지시서`,
    persona: (state) => {
      const authorLevel = getResolvedValue('authorLevel');
      const majorField = getResolvedValue('majorField');
      const personaIntro = `너는 '${majorField}' 전공의 '${authorLevel}' 학생을 돕기 위해, 해당 분야의 지식을 갖춘 전문 AI 어시스턴트야.`;
      const tone = getResolvedValue('tone');
      const toneInstruction = `모든 답변은 '${tone}'을 일관되게 유지해야 해.`;
      return `## 1. AI 페르소나 (AI Persona)\n${personaIntro}\n${toneInstruction}`;
    },
    taskDefinition: (state) => {
      const assignmentType = getResolvedValue('assignmentType');
      return `## 2. 핵심 과업 (Primary Task)\n- **과제 종류:** ${assignmentType}\n- **주제:** ${state.topic || '[주제 입력 필요]'}`;
    },
    chainOfThought: (state) => {
      if (['report', 'summary', 'ppt', 'lab-report'].includes(state.assignmentType.value)) {
        return `## 3. 작업 순서 (Chain of Thought)\n1. **정보 분석:** 내가 제공하는 모든 정보(주제, 키워드, 교수님 강조사항, 참고문헌)를 종합적으로 분석해줘.\n2. **구조 설계:** 분석한 내용을 바탕으로, 과제에 가장 적합한 구조를 설계해줘.\n3. **초안 작성:** 설계한 구조에 따라 내용을 채워 초안을 작성해줘.\n4. **자체 검토:** 아래 '5. 자체 검토 체크리스트'에 따라 결과물을 검토하고 수정해줘.`;
      }
      return '';
    },
    coreInstructions: (state) => {
      const emphasisText = state.emphasis ? `- **교수님 강조 사항:** 다음 사항을 반드시 반영해줘: "${state.emphasis}"` : '';
      const keywordsText = state.keywords ? `- **핵심 키워드:** 다음 키워드를 중심으로 내용을 전개해줘: "${state.keywords}"` : '';
      return `## 4. 세부 지침 (Detailed Instructions)\n${emphasisText}\n${keywordsText}`;
    },
    sourceHandling: (state) => {
      if (state.references) {
        return `- **참고 문헌 활용:** 아래 문헌들의 핵심 논지를 종합하고, 서로 비교/대조하여 논리를 강화해줘. 단순 요약은 지양해줘.\n  - 참고 문헌 리스트:\n${state.references.split('\n').map(line => `    - ${line}`).join('\n')}`;
      }
      return '';
    },
    selfCorrection: (state) => {
      const authorLevel = getResolvedValue('authorLevel');
      const tone = getResolvedValue('tone');
      return `## 5. 자체 검토 체크리스트 (Self-Correction Checklist)\n결과물을 제출하기 전, 아래 항목을 스스로 검토하고 부족한 부분을 수정한 후 최종 답변을 해줘.\n- **[ ] 요구사항 충족:** 내가 요청한 모든 지시사항(주제, 키워드, 강조사항)이 정확히 반영되었는가?\n- **[ ] 페르소나 유지:** 답변의 전체적인 수준이 '${authorLevel}'의 눈높이에 맞는가? '${tone}'이 일관되게 유지되었는가?\n- **[ ] 논리성 및 완결성:** 글의 구조가 체계적이고, 논리적 비약이나 미완성된 부분이 없는가?`;
    }
  };

  const promptRecipes = {
    'default': ['header', 'persona', 'taskDefinition', 'coreInstructions', 'sourceHandling', 'selfCorrection'],
    'report': ['header', 'persona', 'taskDefinition', 'chainOfThought', 'coreInstructions', 'sourceHandling', 'selfCorrection'],
    'summary': ['header', 'persona', 'taskDefinition', 'chainOfThought', 'coreInstructions', 'sourceHandling', 'selfCorrection'],
    'ppt': ['header', 'persona', 'taskDefinition', 'chainOfThought', 'coreInstructions', 'selfCorrection'],
    'brainstorming': ['header', 'persona', 'taskDefinition', 'coreInstructions'],
    'proofreading': ['header', 'persona', 'taskDefinition', 'coreInstructions', 'selfCorrection'],
  };
  
  const generateFinalPrompt = () => {
    if (!promptState.assignmentType.value) {
      generatedPromptEl.textContent = 'Step 1에서 과제 유형을 선택해주세요.';
      return;
    }
    const recipe = promptRecipes[promptState.assignmentType.value] || promptRecipes['default'];
    const prompt = recipe.map(blockName => promptBlocks[blockName]?.(promptState))
                         .filter(Boolean) // Filter out empty strings
                         .join('\n\n');
    generatedPromptEl.textContent = prompt.replace(/(\n\s*){3,}/g, '\n\n');
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
        if (isCustom) customInput.focus();
        else customInput.value = '';
        promptState[groupName].custom = '';
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
        if (isCustom) customInput.focus();
        else customInput.value = '';
        promptState[groupName].custom = '';
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

  formInputs.forEach(input => {
    input.addEventListener('input', () => {
      promptState[input.id] = input.value;
      generateFinalPrompt();
    });
  });
  
  const navigateTo = (stepNum) => {
    steps.forEach(step => step.classList.remove('active'));
    document.getElementById(`step-${stepNum}`).classList.add('active');
    stepMarkers.forEach(marker => marker.classList.toggle('active', marker.dataset.step <= stepNum));
  };

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      let currentStep = parseInt(document.querySelector('.step.active').id.replace('step-', ''));
      navigateTo(button.id.includes('next') ? currentStep + 1 : currentStep - 1);
    });
  });
  
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