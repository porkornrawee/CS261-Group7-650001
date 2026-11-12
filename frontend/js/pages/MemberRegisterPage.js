import { h } from "../core/dom.js";
import { MemberForm } from "../features/member/MemberForm.js";
import { registerExternalMember } from "../api/members.js";
import { Toast } from "../components/ui/Toast.js";

export function MemberRegisterPage() {
    let isLoading = false;

    const container = h("div", { class: "login-page" }, [
        h("div", { class: "login-form-container" }, [
            h("div", { class: "login-form__tabs" }, [
                h("a", { href: "#/login", class: "login-form__tab" }, "นักศึกษา/บุคลากร TU"),
                h("a", { href: "#/register-external", class: "login-form__tab login-form__tab--active" }, "บุคคลทั่วไป")
            ]),
            h("h2", { style: "margin-bottom: 1rem; font-size: 1.25rem;" }, "สมัครสมาชิกบุคคลภายนอก"),
            MemberForm({
                isLoading,
                onSubmit: async (data) => {
                    isLoading = true;
                    try {
                        await registerExternalMember(data);
                        Toast.show("สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ");
                        window.location.hash = "#/login";
                    } finally {
                        isLoading = false;
                    }
                }
            })
        ])
    ]);

    return container;
}