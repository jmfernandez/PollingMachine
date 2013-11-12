#!/bin/bash

if [ $# -gt 0 ] ; then
	poll_image="$1"

	if [ -f "$poll_image" ] ; then
		case "$poll_image" in
			*.jpg)
				poll_id="$(basename "$poll_image" .jpg)"
				photo_mime='image/jpeg'
				;;
			*.png)
				poll_id="$(basename "$poll_image" .png)"
				photo_mime='image/png'
				;;
			*)
				echo "ERROR: unsupported/unrecognized image type of file $poll_image" 1>&2
				exit 1
				;;
		esac
		echo "UPDATE POLL SET photo=x'$(hexdump -v -e '1/1 "%02x"' "$poll_image")', photo_mime='$photo_mime' WHERE poll_id='${poll_id}';"
		echo
	else
		echo "ERROR: input image file $poll_image not found" 1>&2
		exit 1
	fi

else
	echo "ERROR: This SQL BLOB generator needs as input a image file" 1>&2
	exit 1
fi
