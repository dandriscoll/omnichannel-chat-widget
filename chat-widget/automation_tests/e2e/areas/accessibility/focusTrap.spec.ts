import { Browser, BrowserContext } from "playwright";
import * as playwright from "playwright";
import { TestSettings } from "../../../configuration/test-settings";
import { BasePage } from "../../pages/base.page";
import { CustomLiveChatWidgetConstants } from "e2e/utility/constants";

/**
 * ADO 4677981 — TalkBack focus escapes live chat widget
 *
 * When only a single focusable element exists (the chat button in collapsed
 * state), Tab should keep focus trapped on that element instead of escaping
 * the widget boundary.
 */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
describe("focus trap - single focusable element (ADO 4677981)", () => {
    let newBrowser: Browser;
    let context: BrowserContext;
    let page: BasePage;

    beforeEach(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        newBrowser = await playwright[TestSettings.Browsers as any].launch(
            TestSettings.LaunchBrowserSettings
        );
        context = await newBrowser.newContext({
            viewport: TestSettings.Viewport,
        });
    });

    afterEach(async () => {
        if (context) {
            await context.close();
        }
        if (newBrowser) {
            await newBrowser.close();
        }
    });

    test("chat button is visible and focusable", async () => {
        page = new BasePage(await context.newPage());
        await page.openLiveChatWidget("customlivechatwidgets/FocusTrapWidget.html");
        const visible = await page.waitUntilLiveChatSelectorIsVisible(
            CustomLiveChatWidgetConstants.LiveChatButtonId
        );
        expect(visible).toBe(true);
    });

    test("Tab on the chat button keeps focus within the widget", async () => {
        page = new BasePage(await context.newPage());
        await page.openLiveChatWidget("customlivechatwidgets/FocusTrapWidget.html");
        await page.waitUntilLiveChatSelectorIsVisible(
            CustomLiveChatWidgetConstants.LiveChatButtonId
        );

        const chatButton = await page.Page.$(CustomLiveChatWidgetConstants.LiveChatButtonId);
        expect(chatButton).not.toBeNull();

        // Focus the chat button
        await chatButton!.focus(); // eslint-disable-line @typescript-eslint/no-non-null-assertion

        // Press Tab — focus should stay on the chat button (trapped)
        await page.Page.keyboard.press("Tab");

        // Focus should not have escaped to the <body> or outside the widget
        const isFocusInWidget = await page.Page.evaluate(() => {
            const container = document.getElementById("oc-lcw-container");
            return container ? container.contains(document.activeElement) : false;
        });

        expect(isFocusInWidget).toBe(true);
    });

    test("Shift+Tab on the chat button keeps focus within the widget", async () => {
        page = new BasePage(await context.newPage());
        await page.openLiveChatWidget("customlivechatwidgets/FocusTrapWidget.html");
        await page.waitUntilLiveChatSelectorIsVisible(
            CustomLiveChatWidgetConstants.LiveChatButtonId
        );

        const chatButton = await page.Page.$(CustomLiveChatWidgetConstants.LiveChatButtonId);
        expect(chatButton).not.toBeNull();

        await chatButton!.focus();

        // Press Shift+Tab — focus should stay trapped
        await page.Page.keyboard.press("Shift+Tab");

        const isFocusInWidget = await page.Page.evaluate(() => {
            const container = document.getElementById("oc-lcw-container");
            return container ? container.contains(document.activeElement) : false;
        });

        expect(isFocusInWidget).toBe(true);
    });
});
