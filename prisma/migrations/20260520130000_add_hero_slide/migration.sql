CREATE TABLE "HeroSlide" (
  "id"         TEXT          NOT NULL,
  "title"      TEXT          NOT NULL,
  "subtitle"   TEXT,
  "eyebrow"    TEXT,
  "ctaLabel"   TEXT          NOT NULL DEFAULT 'Keşfet',
  "ctaHref"    TEXT          NOT NULL,
  "leftImage"  TEXT,
  "rightImage" TEXT,
  "sortOrder"  INTEGER       NOT NULL DEFAULT 0,
  "isActive"   BOOLEAN       NOT NULL DEFAULT true,
  "startsAt"   TIMESTAMPTZ,
  "endsAt"     TIMESTAMPTZ,
  "createdAt"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);
