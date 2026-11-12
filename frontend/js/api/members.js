import { request } from "./client.js";

export async function registerExternalMember(payload) {
    // ส่งเฉพาะข้อมูลที่จำเป็นตามกำหนด (ไม่ส่ง confirmPassword)
    const { full_name, email, phone, password } = payload;
    return await request("/api/members/register-external", {
        method: "POST",
        body: { full_name, email, phone, password }
    });
}