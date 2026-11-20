import re

ROMAN_URDU_WORDS = {
    'kya', 'kia', 'hai', 'hain', 'ha', 'ka', 'ki', 'ke', 'ko', 'mein', 'me', 'mai', 'main',
    'se', 'par', 'pe', 'tak', 'kab', 'kahan', 'kaha', 'kaise', 'kese', 'kitne', 'kitna',
    'kitni', 'kyun', 'kyu', 'kon', 'kaun', 'nahi', 'nahin', 'mujhe', 'mera', 'meri', 'hum',
    'aap', 'ap', 'tum', 'kar', 'karo', 'karna', 'karein', 'ho', 'hoga', 'hogi', 'hota',
    'sakta', 'sakti', 'chahiye', 'batao', 'bataye', 'bata', 'wala', 'wali', 'abhi', 'kal',
    'aaj', 'shukriya', 'salam', 'assalam', 'janab', 'khula', 'khulta', 'band', 'baje',
    'bimar', 'bimari', 'milega', 'milta', 'milti', 'paisay', 'fees', 'wajah', 'agar', 'aur',
    'lekin', 'bhi', 'to', 'toh', 'jata', 'jati', 'jaye', 'jaaye', 'rehta', 'rehti',
}
URDU_SCRIPT_PATTERN = re.compile(r'[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]')


def detect_language(text: str) -> str:
    """Return english, urdu_roman, or urdu_script for a student message."""
    if URDU_SCRIPT_PATTERN.search(text):
        return 'urdu_script'
    words = re.findall(r'[a-z]+', text.lower())
    matches = sum(word in ROMAN_URDU_WORDS for word in words)
    if matches >= 2 or (len(words) <= 3 and matches >= 1):
        return 'urdu_roman'
    return 'english'


def has_urdu_output(text: str) -> bool:
    return bool(URDU_SCRIPT_PATTERN.search(text)) or detect_language(text) == 'urdu_roman'
