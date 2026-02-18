import { Metadata } from 'next';
import { LegalLayout } from '@/components/LegalLayout';

export const metadata: Metadata = {
    title: 'นโยบายความเป็นส่วนตัว | Kinn',
    description: 'นโยบายความเป็นส่วนตัวของ Kinn — เราเก็บรวบรวมและปกป้องข้อมูลของคุณอย่างไร',
    robots: 'index, follow',
};

export default function PrivacyPage() {
    return (
        <LegalLayout title="นโยบายความเป็นส่วนตัว" lastUpdated="18 กุมภาพันธ์ 2026">

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">1. บทนำ</h2>
                <p>
                    Kinn (ProAssistant) เคารพความเป็นส่วนตัวของผู้ใช้บริการทุกท่าน
                    เอกสารนี้อธิบายว่าเราเก็บรวบรวม ใช้ และปกป้องข้อมูลของคุณอย่างไร
                    เมื่อคุณใช้บริการ Kinn ผ่าน LINE หรือเว็บแอปพลิเคชัน
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">2. ข้อมูลที่เราเก็บรวบรวม</h2>

                <h3 className="text-base font-semibold text-slate-800 mb-2">2.1 ข้อมูลที่คุณให้โดยตรง</h3>
                <ul className="list-disc list-inside space-y-1 mb-4">
                    <li><strong>ข้อมูลจาก LINE:</strong> ชื่อผู้ใช้, รูปโปรไฟล์, LINE User ID</li>
                    <li><strong>ข้อมูลงาน:</strong> หัวข้องาน, รายละเอียด, วันครบกำหนด</li>
                    <li><strong>ข้อความแชท:</strong> ข้อความที่คุณส่งมาเพื่อสร้างงานหรือสนทนากับ AI</li>
                </ul>

                <h3 className="text-base font-semibold text-slate-800 mb-2">2.2 ข้อมูลที่เก็บอัตโนมัติ</h3>
                <ul className="list-disc list-inside space-y-1 mb-4">
                    <li>เวลาที่เข้าใช้งาน, ฟีเจอร์ที่ใช้, ข้อผิดพลาดที่เกิดขึ้น</li>
                    <li>ประเภทอุปกรณ์, ระบบปฏิบัติการ, เบราว์เซอร์</li>
                </ul>

                <h3 className="text-base font-semibold text-slate-800 mb-2">2.3 ข้อมูลจาก Third-party</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li><strong>Stripe:</strong> ข้อมูลการชำระเงิน (เราไม่เก็บเลขบัตรเครดิตโดยตรง)</li>
                    <li><strong>Google Gemini:</strong> ส่งข้อความของคุณไปประมวลผล AI (ไม่ใช้เพื่อฝึกโมเดล)</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">3. วัตถุประสงค์ในการใช้ข้อมูล</h2>
                <p className="mb-3">เราใช้ข้อมูลของคุณเพื่อ:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>ให้บริการ AI Personal Assistant และจัดการงาน</li>
                    <li>ส่งการแจ้งเตือนผ่าน LINE</li>
                    <li>ประมวลผลการชำระเงินสำหรับแพ็กเกจ Pro</li>
                    <li>ปรับปรุงบริการและแก้ไขข้อผิดพลาด</li>
                    <li>วิเคราะห์การใช้งานเพื่อพัฒนาฟีเจอร์ใหม่</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">4. การแบ่งปันข้อมูล</h2>
                <p className="mb-3">เราแบ่งปันข้อมูลกับ Third-party ดังต่อไปนี้เพื่อให้บริการ:</p>
                <ul className="list-disc list-inside space-y-1 mb-4">
                    <li><strong>LINE Corporation</strong> — ส่งข้อความและรับข้อมูลโปรไฟล์</li>
                    <li><strong>Google (Gemini API)</strong> — ประมวลผลคำขอด้วย AI</li>
                    <li><strong>Stripe</strong> — ประมวลผลการชำระเงิน</li>
                    <li><strong>Supabase (AWS)</strong> — เก็บข้อมูลในฐานข้อมูล</li>
                </ul>
                <p className="text-slate-600 bg-slate-50 rounded-lg p-4 text-sm">
                    ❌ เราไม่ขายข้อมูลให้บุคคลที่สาม ไม่ใช้เพื่อโฆษณา และไม่เผยแพร่ข้อมูลส่วนตัวของคุณ
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">5. ระยะเวลาเก็บข้อมูล</h2>
                <ul className="list-disc list-inside space-y-1">
                    <li><strong>ข้อมูลโปรไฟล์:</strong> เก็บไว้จนกว่าคุณจะลบบัญชี</li>
                    <li><strong>ประวัติแชท:</strong> เก็บไว้ 90 วัน (เพื่อให้ AI จำบริบทได้)</li>
                    <li><strong>งาน:</strong> เก็บไว้จนกว่าคุณจะลบ</li>
                    <li><strong>Logs:</strong> เก็บไว้ 30 วัน</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">6. สิทธิของคุณ</h2>
                <p className="mb-3">คุณมีสิทธิ์ดังต่อไปนี้:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li><strong>เข้าถึง:</strong> ขอดูข้อมูลที่เราเก็บเกี่ยวกับคุณ</li>
                    <li><strong>แก้ไข:</strong> แก้ไขข้อมูลที่ไม่ถูกต้อง</li>
                    <li><strong>ลบ:</strong> ขอลบข้อมูลทั้งหมด (ยกเลิกบัญชี)</li>
                    <li><strong>ส่งออก:</strong> ขอรับข้อมูลในรูปแบบที่อ่านได้</li>
                </ul>
                <p className="mt-4 text-sm text-slate-600">
                    วิธีการใช้สิทธิ: ติดต่อเราผ่าน LINE Official Account ของ Kinn
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">7. ความปลอดภัย</h2>
                <p className="mb-3">เราปกป้องข้อมูลของคุณโดย:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>เข้ารหัสข้อมูลด้วย HTTPS/TLS</li>
                    <li>ใช้ Row Level Security (RLS) ใน Supabase</li>
                    <li>จำกัดการเข้าถึงข้อมูลเฉพาะผู้มีสิทธิ์</li>
                    <li>สำรองข้อมูลสม่ำเสมอ</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">8. Cookies</h2>
                <p>
                    เราใช้ Cookies เพื่อเก็บ session ของคุณ (จำการเข้าสู่ระบบ) และ Local Storage
                    เพื่อเก็บการตั้งค่า เราใช้ Vercel Analytics ซึ่งไม่ระบุตัวตนผู้ใช้
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">9. การเปลี่ยนแปลงนโยบาย</h2>
                <p>
                    เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราว การเปลี่ยนแปลงที่สำคัญจะแจ้งผ่าน LINE
                    การเปลี่ยนแปลงจะมีผลหลังจากเผยแพร่ 7 วัน
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">10. ติดต่อเรา</h2>
                <p>หากมีคำถามเกี่ยวกับนโยบายนี้ กรุณาติดต่อผ่าน LINE Official Account ของ Kinn</p>
            </section>

        </LegalLayout>
    );
}
