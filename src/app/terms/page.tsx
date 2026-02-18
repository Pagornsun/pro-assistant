import { Metadata } from 'next';
import { LegalLayout } from '@/components/LegalLayout';

export const metadata: Metadata = {
    title: 'ข้อกำหนดการให้บริการ | Kinn',
    description: 'ข้อกำหนดและเงื่อนไขการใช้บริการ Kinn Personal Executive Assistant',
    robots: 'index, follow',
};

export default function TermsPage() {
    return (
        <LegalLayout title="ข้อกำหนดการให้บริการ" lastUpdated="18 กุมภาพันธ์ 2026">

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">1. การยินยอมใช้บริการ</h2>
                <p>
                    เมื่อคุณใช้ Kinn (ProAssistant) คุณตกลงที่จะปฏิบัติตามข้อกำหนดนี้
                    หากไม่เห็นด้วยกับข้อกำหนดใดๆ กรุณาหยุดใช้บริการทันที
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">2. คุณสมบัติผู้ใช้</h2>
                <ul className="list-disc list-inside space-y-1">
                    <li>ต้องมีอายุอย่างน้อย 13 ปี (หรือตามกฎหมายท้องถิ่น)</li>
                    <li>ต้องมีบัญชี LINE ที่ใช้งานได้</li>
                    <li>ต้องให้ข้อมูลที่ถูกต้องและเป็นปัจจุบัน</li>
                    <li>ห้ามใช้บริการเพื่อวัตถุประสงค์ที่ผิดกฎหมาย</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">3. การใช้บริการ</h2>

                <h3 className="text-base font-semibold text-slate-800 mb-2">3.1 สิ่งที่อนุญาต</h3>
                <ul className="list-disc list-inside space-y-1 mb-4">
                    <li>ใช้เพื่อจัดการงานส่วนตัวหรือธุรกิจ</li>
                    <li>ส่งออกข้อมูลของคุณเอง</li>
                </ul>

                <h3 className="text-base font-semibold text-slate-800 mb-2">3.2 สิ่งที่ห้าม</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li>ทำลาย หรือพยายามเจาะระบบ</li>
                    <li>ส่งข้อมูลที่ผิดกฎหมาย (ลามก, รุนแรง, หมิ่นประมาท)</li>
                    <li>ใช้ bot หรือสคริปต์เพื่อส่งคำขอมากเกินไป</li>
                    <li>แอบอ้างเป็นบุคคลหรือองค์กรอื่น</li>
                    <li>ขายหรือโอนบัญชีให้ผู้อื่น</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">4. แพ็กเกจและการชำระเงิน</h2>

                <h3 className="text-base font-semibold text-slate-800 mb-2">4.1 แพ็กเกจ Free</h3>
                <p className="mb-4">ใช้งานฟีเจอร์พื้นฐานได้ฟรีโดยไม่มีค่าใช้จ่าย</p>

                <h3 className="text-base font-semibold text-slate-800 mb-2">4.2 แพ็กเกจ Pro</h3>
                <ul className="list-disc list-inside space-y-1 mb-4">
                    <li>ฟีเจอร์เพิ่มเติม: งานไม่จำกัด, Priority support</li>
                    <li>การชำระเงิน: ผ่าน Stripe (บัตรเครดิต/เดบิต)</li>
                    <li>การต่ออายุ: ต่ออายุอัตโนมัติทุกเดือน จนกว่าจะยกเลิก</li>
                </ul>

                <h3 className="text-base font-semibold text-slate-800 mb-2">4.3 การยกเลิกและคืนเงิน</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li>คุณสามารถยกเลิกได้ตลอดเวลาผ่านหน้า Subscription</li>
                    <li>ไม่คืนเงินสำหรับเดือนที่ชำระแล้ว แต่จะใช้งานต่อได้จนครบรอบ</li>
                    <li>การยกเลิกมีผลในรอบถัดไป (ไม่ถูกตัดเงินรอบใหม่)</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">5. ทรัพย์สินทางปัญญา</h2>

                <h3 className="text-base font-semibold text-slate-800 mb-2">5.1 ของเรา</h3>
                <p className="mb-4">
                    โค้ด, ดีไซน์, โลโก้ และ AI model ของ Kinn เป็นทรัพย์สินของเรา
                    คุณไม่มีสิทธิ์คัดลอก, แก้ไข, หรือขาย
                </p>

                <h3 className="text-base font-semibold text-slate-800 mb-2">5.2 ของคุณ</h3>
                <p>
                    ข้อมูลและงานที่คุณสร้างเป็นของคุณ เราขออนุญาตใช้เพื่อให้บริการเท่านั้น
                    ไม่ขาย ไม่เผยแพร่
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">6. ข้อจำกัดความรับผิด</h2>
                <p className="mb-3">
                    บริการให้ &ldquo;ตามสภาพที่เป็น&rdquo; (AS IS) เราไม่รับประกันว่าจะไม่มีข้อผิดพลาดหรือไม่หยุดชะงัก
                </p>
                <p className="mb-3">
                    ในกรณีที่มีความเสียหาย ความรับผิดสูงสุดคือจำนวนเงินที่คุณจ่ายในเดือนล่าสุด
                </p>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-4">
                    เราไม่รับผิดชอบต่อ: การสูญหายของข้อมูล, ความล่าช้าจาก Third-party (LINE, Gemini, Stripe),
                    หรือความเสียหายทางอ้อม (รายได้, ชื่อเสียง)
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">7. การระงับและยุติบริการ</h2>
                <p className="mb-3">เราอาจระงับหรือยุติบัญชีของคุณหาก:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>ฝ่าฝืนข้อกำหนดนี้</li>
                    <li>ใช้บริการผิดกฎหมาย</li>
                    <li>ไม่ชำระเงิน (Pro)</li>
                    <li>ไม่ได้ใช้งานเกิน 1 ปี</li>
                </ul>
                <p className="mt-3 text-sm text-slate-600">
                    เราจะแจ้งล่วงหน้า 7 วัน (เว้นแต่กรณีฉุกเฉิน)
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">8. กฎหมายที่ใช้บังคับ</h2>
                <p>
                    ข้อกำหนดนี้อยู่ภายใต้กฎหมายไทย ข้อพิพาทจะตกลงกันก่อน
                    หากไม่ได้ จะใช้ศาลในกรุงเทพมหานคร
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">9. ติดต่อเรา</h2>
                <p>หากมีคำถาม กรุณาติดต่อผ่าน LINE Official Account ของ Kinn</p>
            </section>

        </LegalLayout>
    );
}
