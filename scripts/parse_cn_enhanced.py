import re
import json
import os

# Input files
QUESTIONS_FILE = "/Users/satyamgoyal/Desktop/ISA1-Networks/Computer_Networking_Questions.md"
ANSWERS_FILE = "/Users/satyamgoyal/Desktop/ISA1-Networks/Computer_Networking_Answers.md"

# Output file
OUTPUT_FILE = "/Users/satyamgoyal/Desktop/ISA-Simulator/data/cnQuestions.ts"

def parse_answers(file_path):
    answers = {}
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Parse table rows: | 1 | b | ...
    # Regex to find | Q | Ans | pattern
    matches = re.findall(r'\|\s*(\d+)\s*\|\s*([a-d])\s*', content)
    for q_num, ans in matches:
        answers[int(q_num)] = ['a','b','c','d'].index(ans.lower())
    
    return answers

def parse_questions(file_path, answer_map):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    mcqs = []
    subjective = []
    
    current_q = None
    mode = None # "mcq" or "subjective"
    
    # Track unit/topic based on headers
    current_unit = 1
    current_topic = "Introduction"
    
    # Regex patterns
    q_start_pattern = re.compile(r'\*\*Q(\d+)\.\*\*\s*(.*)')
    option_pattern = re.compile(r'([a-d])\)\s*(.*)')
    
    for line in lines:
        line = line.strip()
        
        # Detect Section Headers
        if "Chapter 1" in line:
            current_unit = 1
            current_topic = "Introduction"
        elif "Chapter 2" in line:
            current_unit = 1
            current_topic = "Application Layer"
        elif "Chapter 3" in line:
            current_unit = 2
            current_topic = "Transport Layer"
            
        # Detect Subjective Section
        if "PART B" in line:
            mode = "subjective"
            continue
            
        if mode == "subjective":
            # Simple subjective extraction (future enhancement)
            continue
            
        # Parse MCQs
        q_match = q_start_pattern.match(line)
        if q_match:
            # Save previous question
            if current_q:
                mcqs.append(current_q)
            
            q_id = int(q_match.group(1))
            prompt = q_match.group(2)
            
            current_q = {
                "id": f"cn_mcq_{q_id}",
                "unit": current_unit,
                "topic": current_topic,
                "topicSlug": current_topic.lower().replace(" ", "-"),
                "prompt": prompt,
                "options": [],
                "correctOptionIndex": answer_map.get(q_id, 0), # Default to 0 if answer missing
                "kind": "mcq"
            }
            continue
            
        opt_match = option_pattern.match(line)
        if current_q and opt_match:
            current_q["options"].append(opt_match.group(2))
            
    # Add last MCQ
    if current_q:
        mcqs.append(current_q)
        
    return mcqs

def generate_ts_file(mcqs):
    ts_content = """import { SubjectQuestionBank } from "@/lib/types";

export const CN_QUESTIONS: SubjectQuestionBank = {
  mcq: [
"""
    for q in mcqs:
        # Ensure exactly 4 options
        while len(q["options"]) < 4:
            q["options"].append("N/A")
            
        ts_content += f"""    {{
      id: "{q['id']}",
      subject: "CN",
      unit: {q['unit']},
      topic: "{q['topic']}",
      topicSlug: "{q['topicSlug']}",
      prompt: {json.dumps(q['prompt'])},
      kind: "mcq",
      options: {json.dumps(q['options'])},
      correctOptionIndex: {q['correctOptionIndex']}
    }},
"""
    ts_content += """  ],
  subjective: []
};
"""
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(ts_content)
    print(f"Generated {len(mcqs)} MCQs in {OUTPUT_FILE}")

if __name__ == "__main__":
    answers = parse_answers(ANSWERS_FILE)
    mcqs = parse_questions(QUESTIONS_FILE, answers)
    generate_ts_file(mcqs)
