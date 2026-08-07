from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime
from enum import Enum

class QuestionType(str, Enum):
    mcq_single = 'mcq'
    mcq_multiple = 'multiple_correct'
    true_false = 'true_false'
    fill_blank = 'fill_blank'
    short_answer = 'short_answer'
    long_answer = 'long_answer'
    code = 'code'

class MockOptionCreate(BaseModel):
    option_text: str
    is_correct: bool = False
    display_order: Optional[int] = None

class MockOption(MockOptionCreate):
    id: str
    question_id: str
    created_at: Optional[datetime] = None

class MockQuestionCreate(BaseModel):
    question_type: QuestionType = QuestionType.mcq_single
    question_text: str
    explanation: Optional[str] = None
    marks: int = 1
    negative_marks: float = 0.0
    display_order: Optional[int] = None
    image_url: Optional[str] = None
    options: Optional[List[MockOptionCreate]] = []

class MockQuestion(BaseModel):
    id: str
    test_id: str
    question_type: QuestionType
    question_text: str
    explanation: Optional[str] = None
    marks: int
    negative_marks: float
    display_order: Optional[int]
    image_url: Optional[str] = None
    options: Optional[List[MockOption]] = []
    created_at: Optional[datetime] = None

class MockTestCreate(BaseModel):
    subject_id: str
    title: str
    description: Optional[str] = None
    duration_minutes: int
    total_marks: int
    pass_marks: Optional[int] = None
    max_attempts: int = 1
    shuffle_questions: bool = True
    show_answers_after: bool = True
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None

class MockTestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    total_marks: Optional[int] = None
    pass_marks: Optional[int] = None
    is_published: Optional[bool] = None
    max_attempts: Optional[int] = None
    shuffle_questions: Optional[bool] = None
    show_answers_after: Optional[bool] = None
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None

class MockTestResponse(MockTestCreate):
    id: str
    created_by: str
    is_published: bool
    created_at: datetime
    updated_at: datetime
    mock_questions: Optional[List[MockQuestion]] = []

### Runtime Payload Schemas

class AnswerSubmit(BaseModel):
    question_id: str
    selected_option_id: Optional[str] = None
    short_answer_text: Optional[str] = None

class AttemptSubmission(BaseModel):
    answers: List[AnswerSubmit]
    
class SaveAttemptSubmission(BaseModel):
    answers: List[AnswerSubmit]    

class MockAttemptResponse(BaseModel):
    id: str
    test_id: str
    user_id: str
    started_at: datetime
    submitted_at: Optional[datetime] = None
    score: Optional[float] = None
    total_correct: int
    total_wrong: int
    total_unanswered: int
    time_taken_seconds: Optional[int] = None
    is_completed: bool

class SubjectiveEvaluation(BaseModel):
    marks_awarded: float
    is_correct: bool

class LeaderboardEntry(BaseModel):
    test_id: str
    user_id: str
    display_name: str
    avatar_url: Optional[str] = None
    best_score: float
    best_time_seconds: int
    total_attempts: int
    rank: int

class StudentAnalyticsResponse(BaseModel):
    accuracy_percentage: float
    average_time_per_question: float
    total_attempts: int
    progress_history: List[Dict[str, Any]]
    
class AdminAnalyticsResponse(BaseModel):
    total_platform_tests: int
    total_platform_attempts: int
    global_average_score: float
