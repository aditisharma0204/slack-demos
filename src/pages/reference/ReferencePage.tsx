import { Link } from 'react-router-dom'
import { PrimaryLinkLarge, SecondaryButton } from '@/components/ui/DesignSystemButtons'
import { StepTypeReference } from '@/reference/StepTypeReference'
import { useState } from 'react'

const pageStyle = { backgroundColor: 'var(--slack-msg-hover)' }
const textStyle = { color: 'var(--slack-text)' }
const mutedStyle = { color: 'var(--slack-msg-muted)' }

export function ReferencePage() {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showStoryLocation, setShowStoryLocation] = useState(false)

  return (
    <div className="min-h-screen flex flex-col" style={pageStyle}>
      <header
        className="sticky top-0 z-20 flex-shrink-0 px-6 py-4 border-b flex items-center justify-between"
        style={{ backgroundColor: 'var(--slack-pane-bg)', borderColor: 'var(--slack-border)' }}
      >
        <Link
          to="/"
          className="font-semibold text-[15px] hover:underline focus:outline-none focus:underline"
          style={{ color: 'var(--slack-text)' }}
        >
          ← Back
        </Link>
        <Link
          to="/canvas"
          className="px-3 py-1.5 rounded text-sm font-medium transition hover:opacity-90"
          style={{
            backgroundColor: 'var(--slack-btn-default-bg)',
            color: 'var(--slack-btn-default-text)',
          }}
        >
          Create new story
        </Link>
      </header>
      <div className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-black text-6xl mb-2" style={textStyle}>
            How to build your story
          </h1>
          <p className="text-base" style={mutedStyle}>
            Write your story the right way so the demo does exactly what you expect. No coding needed.
          </p>
        </div>
        {/* What is a story */}
        <section className="rounded-xl border p-6 bg-white" style={{ borderColor: 'var(--slack-border)' }}>
          <h2 className="font-bold text-lg mb-3" style={textStyle}>
            What is a story?
          </h2>
          <p className="text-base mb-3" style={mutedStyle}>
            A <strong style={textStyle}>story</strong> is your idea written down in plain words: <strong style={textStyle}>who</strong> is in the chat (the people and the bot), and <strong style={textStyle}>what</strong> happens, one thing after another.
          </p>
          <p className="text-base" style={mutedStyle}>
            You write the story. The app turns it into a click-through Slack demo that you can show to others.
          </p>
        </section>

        {/* Example */}
        <section className="rounded-xl border p-6 bg-white" style={{ borderColor: 'var(--slack-border)' }}>
          <h2 className="font-bold text-lg mb-4" style={textStyle}>
            Example: Paternity leave request
          </h2>
          <p className="text-base mb-4" style={mutedStyle}>
            Imagine an employee (Alex) wants to ask for paternity leave. Here’s how to write that story so the demo comes out right.
          </p>
          <p className="text-base mb-4" style={mutedStyle}>
            The demo can show different <strong style={textStyle}>views</strong>: a <strong style={textStyle}>Slackbot view</strong> (DM with the bot), a <strong style={textStyle}>channel view</strong> (e.g. #hr-leave-requests), or a <strong style={textStyle}>thread view</strong> (replies under a channel message). Say where the conversation happens (e.g. “We’re in the channel” or “Slackbot replies in the thread”). If the story has two views open at once (e.g. channel on the left, Slackbot on the right), say so—the app can show both side by side (60% / 40%).
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wide mb-2" style={mutedStyle}>
                Step 1 — One short summary
              </h3>
              <p className="text-base mb-1" style={mutedStyle}>
                Start with one sentence that says what the demo is about:
              </p>
              <blockquote className="pl-4 border-l-2 text-base italic" style={{ borderColor: 'var(--slack-avatar-bg)', ...mutedStyle }}>
                “Alex asks Slackbot for paternity leave. The bot explains the rules, collects his dates, and sends the request to his manager Sarah. When Sarah approves, Alex gets a confirmation.”
              </blockquote>
              <p className="text-sm mt-2" style={mutedStyle}>
                <strong style={textStyle}>Why:</strong> This keeps everything focused. You always know what “done” looks like.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wide mb-2" style={mutedStyle}>
                Step 2 — Who is in the story?
              </h3>
              <p className="text-base mb-2" style={mutedStyle}>
                List every person and the bot, with their role:
              </p>
              <ul className="list-disc list-inside space-y-1 text-base" style={mutedStyle}>
                <li><strong style={textStyle}>Alex</strong> — Employee (asks for leave)</li>
                <li><strong style={textStyle}>Sarah</strong> — Manager (approves or rejects)</li>
                <li><strong style={textStyle}>Slackbot</strong> — The app (guides the process)</li>
              </ul>
              <p className="text-sm mt-2" style={mutedStyle}>
                <strong style={textStyle}>Why:</strong> Every message in the demo comes from someone. Naming them upfront avoids mix-ups.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wide mb-2" style={mutedStyle}>
                Step 3 — What happens, in order
              </h3>
              <p className="text-base mb-3" style={mutedStyle}>
                Write each thing that happens as its own step. One action per step. Use the exact words people and the bot say.
              </p>
              <ol className="list-decimal list-inside space-y-2 text-base pl-1" style={mutedStyle}>
                <li>Alex opens his chat with Slackbot.</li>
                <li>Alex says: <em>“I want to apply for paternity leave.”</em></li>
                <li>Slackbot replies with the policy and a “Choose dates” button.</li>
                <li>Alex clicks “Choose dates” and a date picker opens.</li>
                <li>Alex picks March 15–22 and submits.</li>
                <li><strong style={textStyle}>We switch to Sarah’s screen.</strong> She sees: <em>“Alex has requested paternity leave March 15–22. Approve or reject?”</em></li>
                <li>Sarah clicks Approve.</li>
                <li>Slackbot tells Sarah it has informed Alex.</li>
                <li><strong style={textStyle}>We switch back to Alex’s screen.</strong></li>
                <li>Slackbot tells Alex: <em>“Your leave has been approved. You’re all set for March 15–22!”</em></li>
              </ol>
              <p className="text-sm mt-3" style={mutedStyle}>
                <strong style={textStyle}>Why:</strong> One thing per step makes the demo easy to build. Saying “we switch to Sarah’s screen” tells the app whose view we’re showing. Using real words (what people say) means the demo shows those exact lines.
              </p>
            </div>

            <div className="pt-6 border-t" style={{ borderColor: 'var(--slack-border)' }}>
              <h3 className="font-semibold text-sm uppercase tracking-wide mb-3" style={mutedStyle}>
                Another example: Channel first, then Slackbot side by side
              </h3>
              <p className="text-base mb-4" style={mutedStyle}>
                Same people and outcome as above, but the story starts in a channel. Here’s how to write it so the demo shows <strong style={textStyle}>channel view</strong> first, then <strong style={textStyle}>channel and Slackbot side by side</strong> when Alex applies for leave.
              </p>

              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-sm uppercase tracking-wide mb-2" style={mutedStyle}>
                    Step 1 — One short summary
                  </h4>
                  <p className="text-base mb-1" style={mutedStyle}>
                    One sentence that says what the demo is about and where it starts:
                  </p>
                  <blockquote className="pl-4 border-l-2 text-base italic" style={{ borderColor: 'var(--slack-avatar-bg)', ...mutedStyle }}>
                    &quot;In #team-leave, Sarah asks who&apos;s taking leave this month. Alex says he wants leave, then opens Slackbot and applies for paternity leave. The bot collects his dates and sends the request to Sarah. When Sarah approves, Alex gets a confirmation.&quot;
                  </blockquote>
                  <p className="text-sm mt-2" style={mutedStyle}>
                    <strong style={textStyle}>Why:</strong> This tells the app the story begins in the channel and that Alex later opens Slackbot—so the demo can show channel view first, then both views side by side.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm uppercase tracking-wide mb-2" style={mutedStyle}>
                    Step 2 — Who is in the story?
                  </h4>
                  <p className="text-base mb-2" style={mutedStyle}>
                    Same as the paternity leave example; list everyone and the bot:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-base" style={mutedStyle}>
                    <li><strong style={textStyle}>Sarah</strong> — Manager (asks in the channel; later approves or rejects)</li>
                    <li><strong style={textStyle}>Alex</strong> — Employee (replies in the channel; then applies for leave via Slackbot)</li>
                    <li><strong style={textStyle}>Slackbot</strong> — The app (guides the leave process)</li>
                  </ul>
                  <p className="text-sm mt-2" style={mutedStyle}>
                    <strong style={textStyle}>Why:</strong> Every message comes from one of these. Sarah and Alex both appear in the channel; Alex and Slackbot in the DM.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm uppercase tracking-wide mb-2" style={mutedStyle}>
                    Step 3 — What happens, in order
                  </h4>
                  <p className="text-base mb-3" style={mutedStyle}>
                    Write each thing as its own step. Say when we’re in the channel and when Alex opens Slackbot so the demo can show the right view(s).
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-base pl-1" style={mutedStyle}>
                    <li><strong style={textStyle}>We’re in the channel #team-leave.</strong> Sarah asks: <em>&quot;Who’s taking leave this month?&quot;</em></li>
                    <li>Alex replies in the channel: <em>&quot;I’d like to take leave.&quot;</em></li>
                    <li><strong style={textStyle}>Alex opens Slackbot</strong> (say this so the app can show channel and Slackbot side by side). Alex says to Slackbot: <em>&quot;I want to apply for paternity leave.&quot;</em></li>
                    <li>Slackbot replies with the policy and a &quot;Choose dates&quot; button.</li>
                    <li>Alex clicks &quot;Choose dates&quot; and a date picker opens.</li>
                    <li>Alex picks March 15–22 and submits.</li>
                    <li><strong style={textStyle}>We switch to Sarah’s screen.</strong> She sees: <em>&quot;Alex has requested paternity leave March 15–22. Approve or reject?&quot;</em></li>
                    <li>Sarah clicks Approve.</li>
                    <li>Slackbot tells Sarah it has informed Alex.</li>
                    <li><strong style={textStyle}>We switch back to Alex’s screen.</strong></li>
                    <li>Slackbot tells Alex: <em>&quot;Your leave has been approved. You’re all set for March 15–22!&quot;</em></li>
                  </ol>
                  <p className="text-sm mt-3" style={mutedStyle}>
                    <strong style={textStyle}>Why:</strong> Steps 1–2 are in the channel (demo shows <strong style={textStyle}>channel view</strong>). Step 3 says &quot;Alex opens Slackbot&quot;—that’s when the demo can show <strong style={textStyle}>channel on the left, Slackbot on the right</strong> (60% / 40%). The rest of the steps play out in the Slackbot view (or with both panes visible and the active one advancing).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Do's and Don'ts */}
        <section className="rounded-xl border p-6 bg-white" style={{ borderColor: 'var(--slack-border)' }}>
          <h2 className="font-bold text-lg mb-4" style={textStyle}>
            Do’s and don’ts
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--slack-btn-default-bg)', fontSize: '15px' }}>
                ✓ Do
              </h3>
              <ul className="space-y-2 text-sm" style={mutedStyle}>
                <li>• Write one short summary at the top.</li>
                <li>• List everyone (and the bot) before you write the steps.</li>
                <li>• One action per step (e.g. “Alex sends” then “Slackbot replies” = two steps).</li>
                <li>• Say “Switch to Sarah’s view” when we move to another person’s screen.</li>
                <li>• Say where the conversation lives: Slackbot DM, channel, or thread (e.g. “In #hr-leave-requests, Slackbot posts…” or “Slackbot replies in the thread”).</li>
                <li>• If two views are open (e.g. channel + Slackbot), say so so the demo can show both side by side.</li>
                <li>• Use the real words people and the bot say.</li>
                <li>• Keep the order: first thing said, then the reply, then the next action.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-2" style={{ color: '#c53030', fontSize: '15px' }}>
                ✗ Don’t
              </h3>
              <ul className="space-y-2 text-sm" style={mutedStyle}>
                <li>• Don’t add a step like “Slackbot says thanks for clicking”—the app does that for you.</li>
                <li>• Don’t put two people’s actions in one step (e.g. “Alex and Sarah both send”)—split them.</li>
                <li>• Don’t skip “switch to X’s view” when the conversation moves to someone else.</li>
                <li>• Don’t mix channel and thread without saying which view we’re in (channel vs thread).</li>
                <li>• Don’t write vague lines like “Slackbot says something about policy”—write the actual sentence.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Views: Slackbot, channel, thread */}
        <section className="rounded-xl border p-6 bg-white" style={{ borderColor: 'var(--slack-border)' }}>
          <h2 className="font-bold text-lg mb-2" style={textStyle}>
            Views: Slackbot, channel, and thread
          </h2>
          <p className="text-base mb-3" style={mutedStyle}>
            The demo can show one of three <strong style={textStyle}>views</strong>, or two side by side (60% / 40%):
          </p>
          <ul className="list-disc list-inside space-y-1 text-base mb-3" style={mutedStyle}>
            <li><strong style={textStyle}>Slackbot view</strong> — The DM with Slackbot (messages + composer).</li>
            <li><strong style={textStyle}>Channel view</strong> — A channel (e.g. #hr-leave-requests) with channel messages.</li>
            <li><strong style={textStyle}>Thread view</strong> — A thread under a channel message (replies only).</li>
          </ul>
          <p className="text-base mb-2" style={mutedStyle}>
            Say in your story <em>where</em> the conversation happens (e.g. “In the channel, Slackbot posts…” or “Slackbot replies in the thread”). When the story has two views open at once (e.g. channel on the left, Slackbot on the right), say so—the app will show both panes. Only one pane is “active” per step (the one where the current message or action happens).
          </p>
        </section>

        {/* Slackbot templates — simplified */}
        <section className="rounded-xl border p-6 bg-white" style={{ borderColor: 'var(--slack-border)' }}>
          <h2 className="font-bold text-lg mb-2" style={textStyle}>
            About Slackbot’s replies
          </h2>
          <p className="text-base mb-3" style={mutedStyle}>
            You only write <strong style={textStyle}>what</strong> Slackbot says in your story. The app picks how each reply looks (plain text, buttons, cards). You don’t need to choose that. Slackbot’s replies can appear in the <strong style={textStyle}>Slackbot view</strong> (DM), the <strong style={textStyle}>channel view</strong>, or the <strong style={textStyle}>thread view</strong>—depending on where your story says the conversation is happening. If you want to change how one specific reply looks, you can use the Slackbot templates page.
          </p>
          <Link
            to="/slackbot-templates"
            className="inline-block text-sm font-medium"
            style={{ color: 'var(--slack-avatar-bg)' }}
          >
            Manage Slackbot templates →
          </Link>
        </section>

        {/* Next step */}
        <section className="rounded-xl border p-6 bg-white" style={{ borderColor: 'var(--slack-border)' }}>
          <h2 className="font-bold text-lg mb-2" style={textStyle}>
            What to do next
          </h2>
          <p className="text-base mb-4" style={mutedStyle}>
            Go to <strong style={textStyle}>Create new story</strong>, write your story there, then use <strong style={textStyle}>Copy Demo Prompt</strong> and paste it in Cursor. Cursor will create the demo for you.
          </p>
          <PrimaryLinkLarge to="/canvas">
            Create new story
          </PrimaryLinkLarge>
        </section>

        {/* Sharing — public links */}
        <section
          id="sharing-your-demo"
          className="rounded-xl border p-6 bg-white scroll-mt-6"
          style={{ borderColor: 'var(--slack-border)' }}
        >
          <h2 className="font-bold text-lg mb-3" style={textStyle}>
            Sharing your demo (public link)
          </h2>
          <p className="text-base mb-3" style={mutedStyle}>
            Demos are <strong style={textStyle}>not behind a login</strong>. Anyone who opens the link can view the prototype—the same as you do in the browser.
          </p>
          <p className="text-base mb-3" style={mutedStyle}>
            For the link to work <strong style={textStyle}>for people outside your computer</strong>, the app must be <strong style={textStyle}>deployed</strong> to a public URL (for example Heroku, Netlify, or Vercel). Build with <code className="px-1.5 py-0.5 rounded text-sm" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>npm run build</code> and host the output; see the project <strong style={textStyle}>README</strong> for one-click-style steps (e.g. Heroku).
          </p>
          <ul className="list-disc list-inside space-y-2 text-base mb-3" style={mutedStyle}>
            <li>
              On the <strong style={textStyle}>home page</strong>, use <strong style={textStyle}>Share demo</strong> on a card to copy a link that includes <code className="px-1.5 py-0.5 rounded text-sm" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>?shared=1</code>. That hides &quot;Back&quot; to your demo list and the <strong style={textStyle}>Demos</strong> breadcrumb so recipients only navigate inside the demo you shared. (Opening <code className="px-1.5 py-0.5 rounded text-sm" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>/demo/&lt;id&gt;</code> without that flag still shows full navigation—for your own use.)
            </li>
            <li>
              A link that starts with <code className="px-1.5 py-0.5 rounded text-sm" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>http://localhost</code> only works on your machine—send the deployed URL instead.
            </li>
            <li>
              Demo content is <strong style={textStyle}>included when the app is built</strong>. After you add or change files under <code className="px-1.5 py-0.5 rounded text-sm" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>Demos/</code>, run a new build and redeploy so others get the latest demo.
            </li>
          </ul>
        </section>

        {/* Advanced: step types */}
        <section className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: 'var(--slack-border)' }}>
          <SecondaryButton
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-left rounded-xl"
            border={false}
          >
            Step types (for advanced users)
            <span className="text-xl" aria-hidden>{showAdvanced ? '−' : '+'}</span>
          </SecondaryButton>
          {showAdvanced && (
            <div className="px-6 pb-6 border-t" style={{ borderColor: 'var(--slack-border)' }}>
              <StepTypeReference />
            </div>
          )}
        </section>

        {/* Where your story lives — accordion */}
        <section className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: 'var(--slack-border)' }}>
          <SecondaryButton
            type="button"
            onClick={() => setShowStoryLocation(!showStoryLocation)}
            className="w-full flex items-center justify-between text-left rounded-xl"
            border={false}
          >
            Where is your story in Slack demos?
            <span className="text-xl" aria-hidden>{showStoryLocation ? '−' : '+'}</span>
          </SecondaryButton>
          {showStoryLocation && (
            <div className="px-6 pb-6 pt-4 border-t" style={{ borderColor: 'var(--slack-border)' }}>
              <p className="text-base mb-3" style={mutedStyle}>
                Each demo has its own folder under <strong style={textStyle}>Demos</strong>. The folder name is:
              </p>
              <code
                className="block p-3 rounded-lg text-sm font-mono mb-4 break-all"
                style={{ backgroundColor: 'var(--slack-msg-hover)', color: 'var(--slack-text)' }}
              >
                Demos / &lt;Title&gt; by &lt;Created By&gt; /
              </code>
              <p className="text-base mb-2" style={mutedStyle}>
                <strong style={textStyle}>Example:</strong> <code className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>Demos/Paternity Leave Request by John Doe/</code>
              </p>
              <p className="text-base mb-4" style={mutedStyle}>
                Inside that folder you’ll find: <strong style={textStyle}>demo.json</strong> (the demo definition), <strong style={textStyle}>story.md</strong> (your story in markdown), and one JSON file per human persona (e.g. <code className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>alex.json</code>, <code className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>sarah.json</code>). Slackbot is defined inside <code className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>demo.json</code>.
              </p>
              <p className="text-base mb-4" style={mutedStyle}>
                In the app, your demo appears on the home page and is playable at: <strong style={textStyle}>/demo/&lt;demo-id&gt;</strong> (the <code className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>id</code> comes from <code className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>demo.json</code>). To share that URL with anyone on the internet, deploy the app and read <a href="#sharing-your-demo" className="font-semibold underline" style={{ color: 'var(--slack-mention)' }}>Sharing your demo</a> on this page.
              </p>

              <h3 className="font-semibold text-base mb-3" style={textStyle}>
                How your story uses Slack demos resources
              </h3>
              <p className="text-base mb-4" style={mutedStyle}>
                The playable demo is built by combining <strong style={textStyle}>your demo folder</strong> with <strong style={textStyle}>shared app resources</strong>. The diagram below shows what goes where.
              </p>

              {/* Diagram: your folder + shared resources → playable demo */}
              <div
                className="rounded-lg overflow-hidden border"
                style={{ borderColor: 'var(--slack-border)', backgroundColor: 'var(--slack-msg-hover)' }}
                aria-hidden
              >
                <div className="p-4">
                  <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                    {/* Your demo folder */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="rounded-lg border-2 p-4 h-full"
                        style={{ borderColor: 'var(--slack-avatar-bg)', backgroundColor: 'var(--slack-pane-bg)' }}
                      >
                        <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--slack-avatar-bg)' }}>
                          Your demo folder
                        </div>
                        <div className="font-mono text-sm space-y-1.5" style={mutedStyle}>
                          <div><span className="text-amber-700 dark:text-amber-400">Demos/</span><span style={textStyle}>My Story by Jane/</span></div>
                          <div className="pl-3 border-l-2" style={{ borderColor: 'var(--slack-border)' }}>
                            <div>demo.json</div>
                            <div>story.md</div>
                            <div>alex.json</div>
                            <div>sarah.json</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Plus */}
                    <div className="flex items-center justify-center lg:flex-shrink-0">
                      <span className="text-xl font-bold" style={mutedStyle}>+</span>
                    </div>

                    {/* Shared resources */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="rounded-lg border-2 p-4 h-full"
                        style={{ borderColor: 'var(--slack-btn-secondary-border)', backgroundColor: 'var(--slack-pane-bg)' }}
                      >
                        <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--slack-msg-muted)' }}>
                          Shared Slack demos resources
                        </div>
                        <ul className="text-sm space-y-1.5 list-none" style={mutedStyle}>
                          <li>• Slack response templates (plain text, buttons, cards)</li>
                          <li>• Chat UI &amp; message components</li>
                          <li>• Story engine (runs steps, surfaces, modals)</li>
                          <li>• Design system (buttons, colors, typography)</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Arrow and result */}
                  <div className="flex flex-col items-center mt-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0" style={{ color: 'var(--slack-msg-muted)' }} aria-hidden>
                      <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div
                      className="rounded-lg border-2 px-4 py-3 mt-2 text-center text-sm font-semibold"
                      style={{ borderColor: 'var(--slack-btn-default-bg)', backgroundColor: 'var(--slack-pane-bg)', color: 'var(--slack-text)' }}
                    >
                      Playable demo at /demo/&lt;id&gt;
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
