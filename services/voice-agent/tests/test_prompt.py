import unittest

from recover_voice.prompt import CallContext, build_instructions


class PromptTests(unittest.TestCase):
    def test_prompt_uses_only_supplied_identity_and_evidence(self) -> None:
        prompt = build_instructions(CallContext(
            represented_company="Recover",
            assistant_name="Alex",
            purpose="ask how after-hours calls are handled",
            verified_pain_point="the public website has no visible after-hours booking path",
            disclosure="the automated assistant",
        ))
        self.assertIn("Recover", prompt)
        self.assertIn("no visible after-hours booking path", prompt)
        self.assertIn("Never claim to be human", prompt)
        self.assertIn("Keep the opening below 45 spoken words", prompt)

    def test_prompt_rejects_missing_verified_pain_point(self) -> None:
        with self.assertRaises(ValueError):
            build_instructions(CallContext(
                represented_company="Recover",
                assistant_name="Alex",
                purpose="qualify",
                verified_pain_point="",
                disclosure="the automated assistant",
            ))


if __name__ == "__main__":
    unittest.main()
