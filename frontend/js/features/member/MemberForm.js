import { h } from "../../core/dom.js";
import { Alert, messageFor } from "../../components/ui/Alert.js";

export function MemberForm({ onSubmit, isLoading }) {
    const errorAlert = Alert({ type: "error", class: "hidden" });
    let showPassword = false;
    let showConfirmPassword = false;

    const passwordInput = h("input", {
        type: "password",
        class: "login-form__input",
        name: "password",
        required: true,
        placeholder: "••••••••"
    });

    const confirmPasswordInput = h("input", {
        type: "password",
        class: "login-form__input",
        name: "confirmPassword",
        required: true,
        placeholder: "••••••••"
    });

    const togglePasswordBtn = h("button", {
        type: "button",
        class: "login-form__pw-toggle",
        onclick: () => {
            showPassword = !showPassword;
            passwordInput.type = showPassword ? "text" : "password";
            togglePasswordBtn.textContent = showPassword ? "ซ่อน" : "แสดง";
        }
    }, "แสดง");

    const toggleConfirmBtn = h("button", {
        type: "button",
        class: "login-form__pw-toggle",
        onclick: () => {
            showConfirmPassword = !showConfirmPassword;
            confirmPasswordInput.type = showConfirmPassword ? "text" : "password";
            toggleConfirmBtn.textContent = showConfirmPassword ? "ซ่อน" : "แสดง";
        }
    }, "แสดง");

    const form = h("form", {
        class: "login-form",
        onsubmit: async (e) => {
            e.preventDefault();
            errorAlert.hide();

            const formData = new FormData(form);
            const full_name = formData.get("full_name");
            const email = formData.get("email");
            const phone = formData.get("phone");
            const password = formData.get("password");
            const confirmPassword = formData.get("confirmPassword");

            if (password.length < 8) {
                errorAlert.show("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
                return;
            }

            if (password !== confirmPassword) {
                errorAlert.show("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
                return;
            }

            try {
                await onSubmit({ full_name, email, phone, password });
            } catch (err) {
                errorAlert.show(messageFor(err));
            }
        }
    }, [
        errorAlert.element,
        h("div", { class: "login-form__fields" }, [
            h("div", null, [
                h("label", { class: "login-form__label" }, "ชื่อ-นามสกุล"),
                h("input", { type: "text", class: "login-form__input", name: "full_name", required: true })
            ]),
            h("div", null, [
                h("label", { class: "login-form__label" }, "อีเมล"),
                h("input", { type: "email", class: "login-form__input", name: "email", required: true })
            ]),
            h("div", null, [
                h("label", { class: "login-form__label" }, "เบอร์โทรศัพท์"),
                h("input", { type: "tel", class: "login-form__input", name: "phone", required: true })
            ]),
            h("div", null, [
                h("label", { class: "login-form__label" }, "รหัสผ่าน"),
                h("div", { class: "login-form__pw" }, [passwordInput, togglePasswordBtn])
            ]),
            h("div", null, [
                h("label", { class: "login-form__label" }, "ยืนยันรหัสผ่าน"),
                h("div", { class: "login-form__pw" }, [confirmPasswordInput, toggleConfirmBtn])
            ])
        ]),
        h("button", {
            type: "submit",
            class: "login-form__submit",
            disabled: isLoading
        }, isLoading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก")
    ]);

    return form;
}