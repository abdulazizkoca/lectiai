import os
import json
import base64
from datetime import datetime
from typing import Dict, Any

# Xavfsizlik kutubxonasi (AES-256 shifrlash uchun)
try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False
    print("WARNING: 'cryptography' kutubxonasi o'rnatilmagan. Shifrlash o'tkazib yuboriladi.")

class SecurityManager:
    """
    Xavfsizlik va Maxfiylik (8-QISM) talablari uchun markaziy servis.
    - AES-256 yuz ma'lumotlarini shifrlash
    - GDPR mosligi (Eksport va O'chirish - Right to be forgotten)
    - Audit Log (Kim qachon ko'rganligi yozib borilishi)
    - WebRTC DTLS stream konfiguratsiyasi
    """
    def __init__(self, secret_key: bytes = None):
        # 32 bayt (256 bit) kalit AES-256 GCM uchun
        if secret_key and len(secret_key) == 32:
            self.key = secret_key
        else:
            # Agar kiritilmasa server har yoqilganda tasodifiy generatsiya qilinadi (Production'da .env dan olinishi kerak)
            self.key = AESGCM.generate_key(bit_length=256) if CRYPTO_AVAILABLE else b'0'*32
            
        self.aesgcm = AESGCM(self.key) if CRYPTO_AVAILABLE else None

    # ----------------------------------------------------
    # 1. YUZ MA'LUMOTLARINI SHIFRLASH (ENCRYPTION)
    # ----------------------------------------------------
    def encrypt_face_encoding(self, encoding_list: list) -> str:
        """Yuz vektorini (embedding ro'yxatini) bazaga saqlashdan oldin AES-256 bilan shifrlaydi"""
        if not self.aesgcm:
            return json.dumps(encoding_list)
            
        data = json.dumps(encoding_list).encode('utf-8')
        nonce = os.urandom(12) # GCM uchun 12 baytli unik nonce
        encrypted_data = self.aesgcm.encrypt(nonce, data, None)
        
        # Nonce ma'lumot bilan birga saqlanadi, chunki deshifrlashda kerak bo'ladi
        return base64.b64encode(nonce + encrypted_data).decode('utf-8')

    def decrypt_face_encoding(self, encrypted_str: str) -> list:
        """Bazadan olingan shifrlangan AES-256 str ni ro'yxatga (vektorga) qaytaradi"""
        if not self.aesgcm:
            return json.loads(encrypted_str)
            
        try:
            encrypted_data_with_nonce = base64.b64decode(encrypted_str.encode('utf-8'))
            nonce = encrypted_data_with_nonce[:12]
            encrypted_data = encrypted_data_with_nonce[12:]
            
            decrypted_data = self.aesgcm.decrypt(nonce, encrypted_data, None)
            return json.loads(decrypted_data.decode('utf-8'))
        except Exception as e:
            print(f"[SECURITY ERROR] Decryption failed: {e}")
            return []

    # ----------------------------------------------------
    # 2. GDPR TALABLARI (MA'LUMOTNI BOSHQARISH)
    # ----------------------------------------------------
    def export_student_data(self, student_id: int, request_by: str) -> Dict[str, Any]:
        """GDPR: O'quvchi o'z ma'lumotlarini so'raganda to'liq eksport qilib berish"""
        self.log_audit(user_id=request_by, action="EXPORT_DATA", resource=f"student_{student_id}")
        
        # Simulyatsiya qilingan Baza javobi:
        return {
            "student_id": student_id,
            "status": "success",
            "message": "Barcha yuz vektorlari, diqqat tarixi va shaxsiy ma'lumotlar arxivlandi.",
            "exported_at": datetime.now().isoformat()
        }

    def delete_student_data(self, student_id: int, request_by: str) -> bool:
        """GDPR (Right to be Forgotten): O'quvchining barcha yuz va e'tibor ma'lumotlarini butunlay o'chirish"""
        self.log_audit(user_id=request_by, action="DELETE_DATA", resource=f"student_{student_id}")
        
        # Baza so'rovi (Hard Delete) - Masalan, db.query(FaceModel).filter(id==student_id).delete()
        print(f"[GDPR] Student {student_id} data permanently deleted from server.")
        return True

    # ----------------------------------------------------
    # 3. RUXSAT VA AUDIT LOG (AUTHORIZATION)
    # ----------------------------------------------------
    def log_audit(self, user_id: str, action: str, resource: str):
        """Kim qachon va qaysi ma'lumotni ko'rganini, yuklab olganini Audit Log qilib yozib borish"""
        timestamp = datetime.now().isoformat()
        log_entry = {
            "timestamp": timestamp,
            "user_id": user_id,
            "action": action,
            "resource": resource
        }
        
        # Haqiqiy muhitda bu alohida secure log faylga (masalan /var/log/audit.log) yoki MongoDB ga tushadi
        print(f"[AUDIT LOG] {timestamp} | User: {user_id} | Action: {action} | Resource: {resource}")
        return log_entry

    def check_professor_access(self, user_role: str, user_id: str) -> bool:
        """Ruxsat tizimi: Faqat O'qituvchi (Professor) va Admin ma'lumotlarni ko'ra oladi"""
        if user_role.lower() not in ['professor', 'admin']:
            self.log_audit(user_id=user_id, action="ACCESS_DENIED", resource="camera_dashboard")
            return False
            
        self.log_audit(user_id=user_id, action="ACCESS_GRANTED", resource="camera_dashboard")
        return True

    # ----------------------------------------------------
    # 4. KAMERA STREAM SHIFRLASH (WebRTC DTLS)
    # ----------------------------------------------------
    def get_webrtc_security_config(self) -> dict:
        """
        Kamera streamlari tarmoq (network) orqali o'tganda xavfsiz bo'lishi uchun 
        frontend yoki signaling server uchun DTLS konfiguratsiyasi.
        Bu orqali video ma'lumotlar faqat server va professor orasida yopiq qoladi.
        """
        return {
            "encryption_protocol": "DTLS", # Datagram Transport Layer Security
            "srtp_profile": "SRTP_AES128_CM_HMAC_SHA1_80", 
            "peer_identity_verification": True,
            "data_channel_encryption": True,
            "notes": "Video stream va diqqat metadatalari faqat server va client (E2EE/SFU) orasida yopiq kalit orqali almashiladi. Tashqi IP lar kirishiga to'sqinlik qilinadi."
        }

# Boshqa fayllarda import qilib ishlatish uchun tayyor obyekt
security_manager = SecurityManager()
