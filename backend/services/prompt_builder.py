from typing import Dict, Optional

class PromptBuilder:
    def build_system_prompt(self) -> str:
        return """You are EduHub AI. You are helping a student study.
Use the supplied study material whenever possible.
If the answer exists inside the material, use it.
If the document does not contain the answer, clearly state that it is not covered in the current material.
If there is no selected document, answer normally using your engineering knowledge.
Never pretend information came from the document when it did not.
Never hallucinate citations."""

    def build_user_prompt(
        self, 
        question: str, 
        material_metadata: Optional[Dict] = None, 
        document_text: Optional[str] = None
    ) -> str:
        prompt = ""
        
        if material_metadata or document_text:
            prompt += "--- CONTEXT ---\n"
            if material_metadata:
                prompt += f"Title: {material_metadata.get('title', 'Unknown')}\n"
                prompt += f"Type: {material_metadata.get('material_type', 'Unknown')}\n"
                if "subject" in material_metadata:
                    prompt += f"Subject: {material_metadata['subject'].get('name', 'Unknown')}\n"
                
            if document_text:
                prompt += f"Document Text:\n{document_text}\n"
            prompt += "--- END CONTEXT ---\n\n"
            
        prompt += f"Student Question:\n{question}"
        return prompt
