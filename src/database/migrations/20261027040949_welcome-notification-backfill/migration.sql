-- A welcome for every account that existed before sign-up started writing one
-- (`NotificationsService.welcome()`), in Thai on the row and in both languages in
-- `notification_translations`, as every notification is.
--
-- - Idempotent: an account that already has its WELCOME is skipped, so a second run
--   writes nothing. `notifications_welcome_owner_key` holds the same rule for a
--   sign-up landing while this runs.
-- - A verified Advisor (the identity check `isVerifiedAdvisor()` makes) is asked to
--   finish their profile, and `resource_id` is their own user id, the profile it is
--   about; everyone else gets the Advisee welcome sign-up writes, with no resource.
-- - Dated at the account's own creation, so an old account's welcome sits at the
--   bottom of its feed rather than on top. `user.created_at` is better-auth's
--   timestamp without time zone, written in UTC.
WITH "welcomed" AS (
	INSERT INTO "notifications" ("owner_id", "type", "title", "content", "resource_id", "created_at")
	SELECT
		u."id",
		'WELCOME'::"notification_type",
		'ยินดีต้อนรับสู่ Advisory',
		CASE
			WHEN verified."advisor_id" IS NULL THEN 'เริ่มจากหาผู้เชี่ยวชาญที่ใช่สำหรับคำถามของคุณ'
			ELSE 'กรอกโปรไฟล์ให้ครบ เพื่อให้ผู้รับคำปรึกษาเจอคุณ'
		END,
		verified."advisor_id",
		u."created_at" AT TIME ZONE 'UTC'
	FROM "user" u
	LEFT JOIN "advisor_identity" verified
		ON verified."advisor_id" = u."id" AND verified."verification_status" = 'VERIFIED'
	WHERE NOT EXISTS (
		SELECT 1 FROM "notifications" n WHERE n."owner_id" = u."id" AND n."type" = 'WELCOME'
	)
	RETURNING "id", "resource_id"
)
INSERT INTO "notification_translations" ("notification_id", "locale", "title", "content")
SELECT
	"id",
	'th'::"content_locale",
	'ยินดีต้อนรับสู่ Advisory',
	CASE
		WHEN "resource_id" IS NULL THEN 'เริ่มจากหาผู้เชี่ยวชาญที่ใช่สำหรับคำถามของคุณ'
		ELSE 'กรอกโปรไฟล์ให้ครบ เพื่อให้ผู้รับคำปรึกษาเจอคุณ'
	END
FROM "welcomed"
UNION ALL
SELECT
	"id",
	'en'::"content_locale",
	'Welcome to Advisory',
	CASE
		WHEN "resource_id" IS NULL THEN 'Start by finding the right expert for your question'
		ELSE 'Complete your profile so advisees can find you'
	END
FROM "welcomed";
